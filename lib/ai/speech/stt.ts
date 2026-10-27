/**
 * Speech-to-text adapter — zero-key default: browser Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition).
 *
 * Provider is swappable via SPEECH_STT_PROVIDER env (web | groq | sarvam).
 * Hosted providers (Groq Whisper, Sarvam) are invoked server-side so keys
 * never reach the client; the web path needs no keys and is the fallback.
 */

import { LANG_BCP47 } from './tts';

export type STTProvider = 'web' | 'groq' | 'sarvam' | 'gnani';

export function getSTTProvider(): STTProvider {
  const p =
    process.env.NEXT_PUBLIC_SPEECH_STT_PROVIDER?.toLowerCase() ??
    process.env.SPEECH_STT_PROVIDER?.toLowerCase();
  if (p === 'groq' || p === 'sarvam' || p === 'gnani') return p;
  return 'web';
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, RecognitionCtor | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSTTSupported(): boolean {
  return (
    getRecognitionCtor() !== null ||
    (getSTTProvider() === 'gnani' && isMicSupported())
  );
}

export function isMicSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export interface Recognizer {
  start(): void;
  stop(): void;
}

/**
 * One-shot recognizer: listens once, calls onResult with the best transcript,
 * then ends. Falls back gracefully — callers should check isSTTSupported().
 */
export function createRecognizer(
  language: string,
  handlers: {
    onResult: (transcript: string) => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  }
): Recognizer | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = LANG_BCP47[language.toLowerCase()] ?? 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e: unknown) => {
    const evt = e as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
    const transcript = evt.results?.[0]?.[0]?.transcript ?? '';
    if (transcript) handlers.onResult(transcript);
  };
  rec.onerror = (e: unknown) => {
    const err = (e as { error?: string })?.error ?? 'unknown';
    handlers.onError?.(err);
  };
  rec.onend = () => handlers.onEnd?.();

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
  };
}

/* ---------- Server STT (Gnani): record → WAV → /api/ai/speech/stt -------- */

function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (inRate === outRate) return input;
  const ratio = inRate / outRate;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Server-STT recognizer: records mic → encodes 16kHz WAV → POSTs to
 * /api/ai/speech/stt → onResult(transcript). Used when
 * NEXT_PUBLIC_SPEECH_STT_PROVIDER=gnani; callers fall back to web STT /
 * text input if it errors.
 */
export function createServerRecognizer(
  language: string,
  handlers: {
    onResult: (transcript: string) => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  }
): Recognizer | null {
  if (!isMicSupported()) return null;
  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let chunks: Float32Array[] = [];
  let finished = false;

  const start = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      processor = audioCtx.createScriptProcessor(4096, 1, 1);
      chunks = [];
      processor.onaudioprocess = (e) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch {
      handlers.onError?.('mic-denied');
      handlers.onEnd?.();
    }
  };

  const stop = async () => {
    if (finished) return;
    finished = true;
    try {
      processor?.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
      const rate = audioCtx?.sampleRate ?? 16000;
      await audioCtx?.close().catch(() => undefined);
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of chunks) {
        merged.set(c, off);
        off += c.length;
      }
      if (merged.length < rate / 4) throw new Error('too-short');
      const wav = encodeWAV(downsample(merged, rate, 16000), 16000);
      const form = new FormData();
      form.append('audio_file', new File([wav], 'speech.wav', { type: 'audio/wav' }));
      form.append('language', language);
      const res = await fetch('/api/ai/speech/stt', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`stt ${res.status}`);
      const data = (await res.json()) as { transcript?: string };
      if (!data.transcript) throw new Error('empty');
      handlers.onResult(data.transcript);
    } catch (e) {
      handlers.onError?.(e instanceof Error ? e.message : 'stt-failed');
    } finally {
      handlers.onEnd?.();
    }
  };

  return {
    start: () => void start(),
    stop: () => void stop(),
  };
}

/**
 * Provider-chain recognizer: prefers the configured server provider
 * (Gnani), falls back to the browser recognizer when it's unavailable.
 */
export function createBestRecognizer(
  language: string,
  handlers: Parameters<typeof createRecognizer>[1]
): Recognizer | null {
  if (getSTTProvider() === 'gnani') {
    const server = createServerRecognizer(language, handlers);
    if (server) return server;
  }
  return createRecognizer(language, handlers);
}

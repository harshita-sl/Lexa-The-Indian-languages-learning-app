/**
 * Speech-to-text adapter — zero-key default: browser Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition).
 *
 * Provider is swappable via SPEECH_STT_PROVIDER env (web | groq | sarvam).
 * Hosted providers (Groq Whisper, Sarvam) are invoked server-side so keys
 * never reach the client; the web path needs no keys and is the fallback.
 */

import { LANG_BCP47 } from './tts';

export type STTProvider = 'web' | 'groq' | 'sarvam';

export function getSTTProvider(): STTProvider {
  const p = process.env.SPEECH_STT_PROVIDER?.toLowerCase();
  if (p === 'groq' || p === 'sarvam') return p;
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
  return getRecognitionCtor() !== null;
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

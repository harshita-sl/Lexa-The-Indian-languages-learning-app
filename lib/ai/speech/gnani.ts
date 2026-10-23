/**
 * Gnani.ai (Vachana) speech adapter — server-side only; the key never
 * reaches the client. Docs: https://docs.gnani.ai
 *
 *   STT  POST {base}/stt/v3                multipart, audio ≤60s
 *   TTS  POST {base}/api/v1/tts/inference  JSON → binary audio
 *   Auth header: X-API-Key-ID: <key>
 *
 * Env contract:
 *   GNANI_API_KEY        — set yourself; never commit
 *   GNANI_BASE_URL       — default https://api.vachana.ai
 *   GNANI_TTS_MODEL      — default timbre-v3.0 (voices speak all 10 langs)
 *   GNANI_TTS_VOICE      — default Lakshmi
 *   SPEECH_TTS_PROVIDER=gnani / SPEECH_STT_PROVIDER=gnani
 *
 * Without a key, calls throw 'gnani not configured' → routes answer 503 →
 * the client falls back to Web Speech.
 */

const TIMEOUT_MS = 15000;
const BASE_DEFAULT = 'https://api.vachana.ai';

// api.vachana.ai sits behind Cloudflare bot protection that resets Node's
// default undici TLS fingerprint (ECONNRESET); a browser/curl UA passes.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) LexaSpeech/1.0';

const LANG_MAP: Record<string, string> = {
  telugu: 'te-IN',
  kannada: 'kn-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  malayalam: 'ml-IN',
  bengali: 'bn-IN',
  english: 'en-IN',
};

export function gnaniConfigured(): boolean {
  return Boolean(process.env.GNANI_API_KEY);
}

function base(): string {
  return (process.env.GNANI_BASE_URL ?? BASE_DEFAULT).replace(/\/$/, '');
}

export function gnaniLangCode(language: string): string {
  return LANG_MAP[language.toLowerCase()] ?? 'hi-IN';
}

export interface TTSResult {
  audio: ArrayBuffer;
  contentType: string;
}

export async function gnaniTTS(text: string, language: string): Promise<TTSResult> {
  if (!gnaniConfigured()) throw new Error('gnani not configured');
  const res = await fetch(`${base()}/api/v1/tts/inference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key-ID': process.env.GNANI_API_KEY!,
      'User-Agent': UA,
    },
    body: JSON.stringify({
      text,
      voice: process.env.GNANI_TTS_VOICE ?? 'Lakshmi',
      model: process.env.GNANI_TTS_MODEL ?? 'timbre-v3.0',
      language: gnaniLangCode(language),
      speed: 1.0,
      audio_config: { container: 'wav', num_channels: 1 },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Gnani TTS failed (${res.status}): ${msg.slice(0, 200)}`);
  }
  return {
    audio: await res.arrayBuffer(),
    contentType: res.headers.get('content-type') ?? 'audio/wav',
  };
}

export interface STTResult {
  transcript: string;
  requestId?: string;
}

export async function gnaniSTT(
  audio: Buffer,
  language: string,
  filename = 'speech.wav',
  contentType = 'audio/wav'
): Promise<STTResult> {
  if (!gnaniConfigured()) throw new Error('gnani not configured');
  const form = new FormData();
  form.append('audio_file', new Blob([new Uint8Array(audio)], { type: contentType }), filename);
  form.append('language_code', gnaniLangCode(language));
  form.append('format', 'transcribe'); // ITN: numbers/dates rendered naturally

  const res = await fetch(`${base()}/stt/v3`, {
    method: 'POST',
    headers: { 'X-API-Key-ID': process.env.GNANI_API_KEY!, 'User-Agent': UA },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Gnani STT failed (${res.status}): ${msg.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    success?: boolean;
    transcript?: string;
    request_id?: string;
  };
  if (!data.transcript) throw new Error('Gnani STT returned empty transcript');
  return { transcript: data.transcript, requestId: data.request_id };
}

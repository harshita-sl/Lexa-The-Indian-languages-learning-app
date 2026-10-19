/**
 * Text-to-speech adapter — zero-key default: browser Web Speech API.
 *
 * Provider is swappable via SPEECH_TTS_PROVIDER env (web | sarvam | groq).
 * The web path is client-side only and needs no keys; hosted providers are
 * invoked through server routes so keys never reach the client.
 */

export const LANG_BCP47: Record<string, string> = {
  telugu: 'te-IN',
  kannada: 'kn-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  english: 'en-IN',
};

export type TTSProvider = 'web' | 'sarvam' | 'groq' | 'gnani';

export function getTTSProvider(): TTSProvider {
  const p =
    process.env.NEXT_PUBLIC_SPEECH_TTS_PROVIDER?.toLowerCase() ??
    process.env.SPEECH_TTS_PROVIDER?.toLowerCase();
  if (p === 'sarvam' || p === 'groq' || p === 'gnani') return p;
  return 'web';
}

export function isTTSSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || getTTSProvider() === 'gnani')
  );
}

/** Pick the best installed voice for a language, preferring exact locale. */
function pickVoice(bcp47: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(bcp47.split('-')[0])) ??
    null
  );
}

export function speak(text: string, language: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text)
    return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const bcp47 = LANG_BCP47[language.toLowerCase()] ?? 'en-IN';
  utterance.lang = bcp47;
  const voice = pickVoice(bcp47);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  synth.speak(utterance);
  return true;
}

let currentAudio: HTMLAudioElement | null = null;

async function speakViaServer(text: string, language: string): Promise<boolean> {
  try {
    const res = await fetch('/api/ai/speech/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;
    stopSpeaking();
    currentAudio = new Audio(URL.createObjectURL(blob));
    await currentAudio.play();
    return true;
  } catch {
    return false;
  }
}

/**
 * Provider-chain speak: when SPEECH_TTS_PROVIDER=gnani, synthesize on the
 * server first (key stays server-side); any failure falls back to Web Speech.
 */
export async function speakWithProvider(
  text: string,
  language: string
): Promise<boolean> {
  if (!text) return false;
  if (getTTSProvider() === 'gnani') {
    const ok = await speakViaServer(text, language);
    if (ok) return true;
  }
  return speak(text, language);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

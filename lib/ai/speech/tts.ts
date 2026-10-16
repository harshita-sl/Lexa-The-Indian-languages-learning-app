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

export type TTSProvider = 'web' | 'sarvam' | 'groq';

export function getTTSProvider(): TTSProvider {
  const p = process.env.SPEECH_TTS_PROVIDER?.toLowerCase();
  if (p === 'sarvam' || p === 'groq') return p;
  return 'web';
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
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
  if (!isTTSSupported() || !text) return false;
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

export function stopSpeaking(): void {
  if (isTTSSupported()) window.speechSynthesis.cancel();
}

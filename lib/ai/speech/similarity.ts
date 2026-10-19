/**
 * Pronunciation similarity scorer.
 *
 * Compares an STT transcript against the expected phrase. Both sides are
 * normalized (Indic → ASCII roman when transliteration is available,
 * lowercase, punctuation stripped) then scored by normalized Levenshtein.
 *
 * 1.0 = perfect · ≥0.75 pass · 0.45–0.75 close · <0.45 miss
 */

import { indicToRoman } from '../indic/transliteration';

export interface SimilarityResult {
  /** 0..1 — higher is closer. */
  score: number;
  verdict: 'pass' | 'close' | 'miss';
  /** Whether a transliteration was applied to either side. */
  transliterated: boolean;
}

export function scorePronunciation(
  heard: string,
  expected: string,
  language: string
): SimilarityResult {
  const a = normalize(heard, language);
  const b = normalize(expected, language);
  if (!a.text || !b.text) return { score: 0, verdict: 'miss', transliterated: false };
  const score = 1 - levenshtein(a.text, b.text) / Math.max(a.text.length, b.text.length);
  const rounded = Math.max(0, Math.round(score * 100) / 100);
  return {
    score: rounded,
    verdict: rounded >= 0.75 ? 'pass' : rounded >= 0.45 ? 'close' : 'miss',
    transliterated: a.translitApplied || b.translitApplied,
  };
}

function normalize(
  text: string,
  language: string
): { text: string; translitApplied: boolean } {
  const trimmed = text.trim().toLowerCase();
  const hasIndic = /[ఀ-౿ಀ-ಿऀ-ॿ]/.test(trimmed);
  let out = trimmed;
  let applied = false;
  if (hasIndic) {
    try {
      const lang = language.toLowerCase();
      if (lang === 'telugu' || lang === 'kannada' || lang === 'hindi') {
        out = indicToRoman(trimmed, lang).toLowerCase();
        applied = true;
      }
    } catch {
      // keep raw text
    }
  }
  return {
    text: out.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim(),
    translitApplied: applied,
  };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

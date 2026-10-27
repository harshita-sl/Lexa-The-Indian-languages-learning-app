import { describe, it, expect } from 'vitest';
import {
  romanToIndic,
  normalizeIndicPhonetics,
  isFuzzyIndicMatch,
  getScriptScaffolding,
} from './transliteration';

describe('romanToIndic', () => {
  it('converts basic Telugu words', () => {
    expect(romanToIndic('namaskaaram', 'telugu')).toBe('నమస్కారం');
    expect(romanToIndic('meeru', 'telugu')).toBe('మీరు');
  });

  it('handles aspirated consonants and conjuncts in Hindi', () => {
    // casual spelling "dhanyavaad" must yield धन्यवाद, not धञवाद्
    expect(romanToIndic('dhanyavaad', 'hindi')).toBe('धन्यवाद');
    expect(romanToIndic('namaste', 'hindi')).toBe('नमस्ते');
  });

  it('handles Kannada consonants (capital = retroflex)', () => {
    expect(romanToIndic('kannaDa', 'kannada')).toBe('ಕನ್ನಡ');
    expect(romanToIndic('hegiddira', 'kannada')).toBe('ಹೆಗಿದ್ದಿರ');
  });
});

describe('normalizeIndicPhonetics', () => {
  it('collapses vowel-length variants', () => {
    expect(normalizeIndicPhonetics('Namaskaaram')).toBe('namaskaram');
    expect(normalizeIndicPhonetics('dhanyavād')).toBe('danyavad');
  });
});

describe('isFuzzyIndicMatch', () => {
  it('matches romanized vs script variants phonetically', () => {
    expect(isFuzzyIndicMatch('namaskaram', 'నమస్కారం')).toBe(false); // script has no roman letters
  });

  it('matches transliteration spelling variants', () => {
    expect(isFuzzyIndicMatch('dhanyavad', 'dhanyavaad')).toBe(true);
  });

  it('accepts answers embedded in "script (roman)" format', () => {
    expect(isFuzzyIndicMatch('mancham', 'మంచం (Mancham)')).toBe(true);
  });

  it('tolerates a small typo', () => {
    expect(isFuzzyIndicMatch('namskaram', 'namaskaram')).toBe(true);
  });

  it('rejects unrelated words', () => {
    expect(isFuzzyIndicMatch('biryani', 'namaskaram')).toBe(false);
  });
});

describe('getScriptScaffolding', () => {
  it('converts roman input to script + romanized pair', () => {
    const s = getScriptScaffolding('namaskaaram', 'telugu');
    expect(s.script).toBe('నమస్కారం');
    expect(s.romanized).toBe('namaskaaram');
  });

  it('extracts bracketed romanization from script text', () => {
    const s = getScriptScaffolding('నమస్కారం (Namaskaram)', 'telugu');
    expect(s.script).toBe('నమస్కారం');
    expect(s.romanized).toBe('Namaskaram');
  });
});

import { describe, it, expect } from 'vitest';
import { scorePronunciation } from './similarity';

describe('scorePronunciation', () => {
  it('identical strings score 1.0 / pass', () => {
    const r = scorePronunciation('namaskaram', 'namaskaram', 'telugu');
    expect(r.score).toBe(1);
    expect(r.verdict).toBe('pass');
  });

  it('is case- and punctuation-insensitive', () => {
    const r = scorePronunciation('Namaskaram!', 'namaskaram', 'telugu');
    expect(r.score).toBe(1);
  });

  it('near-miss roman telugu scores close or pass', () => {
    const r = scorePronunciation('namaskaramm', 'namaskaram', 'telugu');
    expect(r.score).toBeGreaterThanOrEqual(0.75);
    expect(r.verdict).not.toBe('miss');
  });

  it('unrelated text is a miss', () => {
    const r = scorePronunciation('zzzz qqqq', 'namaskaram', 'telugu');
    expect(r.score).toBeLessThan(0.45);
    expect(r.verdict).toBe('miss');
  });

  it('native script vs roman transliteration scores high', () => {
    const r = scorePronunciation('నమస్కారం', 'namaskaram', 'telugu');
    expect(r.transliterated).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0.6);
  });

  it('empty input is a miss without throwing', () => {
    expect(scorePronunciation('', 'namaskaram', 'telugu').verdict).toBe('miss');
    expect(scorePronunciation('   ', '', 'telugu').score).toBe(0);
  });
});

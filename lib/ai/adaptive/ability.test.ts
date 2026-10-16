import { describe, it, expect } from 'vitest';
import {
  expectedScore,
  updateAbility,
  eloToLevel,
  targetItemBeta,
  eloProximity,
  kFactor,
  conceptTypeToSkill,
} from './ability';
import { bktUpdate, bktPriorForLevel, bktPredictCorrect, bktIsMastered, DEFAULT_BKT } from './bkt';
import { deriveRating } from './learner-model';

describe('Elo ability model', () => {
  it('expects 50% when ability equals difficulty', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
  });

  it('raises elo on win, lowers on loss', () => {
    const s = { elo: 1000, attempts: 0, correct: 0 };
    const win = updateAbility(s, 900, true);
    expect(win.ability.elo).toBeGreaterThan(1000);
    const loss = updateAbility(s, 900, false);
    expect(loss.ability.elo).toBeLessThan(1000);
  });

  it('K-factor decays with experience', () => {
    expect(kFactor(0)).toBe(48);
    expect(kFactor(15)).toBe(32);
    expect(kFactor(50)).toBe(16);
  });

  it('targets ~75% success difficulty below theta', () => {
    const beta = targetItemBeta(1000);
    expect(expectedScore(1000, beta)).toBeCloseTo(0.75, 2);
  });

  it('eloProximity peaks at the target difficulty', () => {
    const peak = eloProximity(1000, targetItemBeta(1000));
    const off = eloProximity(1000, targetItemBeta(1000) + 300);
    expect(peak).toBeCloseTo(1, 5);
    expect(off).toBeLessThan(peak);
  });

  it('maps elo to levels', () => {
    expect(eloToLevel(800)).toBe('beginner');
    expect(eloToLevel(1000)).toBe('intermediate');
    expect(eloToLevel(1300)).toBe('advanced');
  });

  it('maps concept types to skills', () => {
    expect(conceptTypeToSkill('script')).toBe('script');
    expect(conceptTypeToSkill('grammar_rule')).toBe('grammar');
    expect(conceptTypeToSkill('honorific')).toBe('conversation');
  });
});

describe('BKT', () => {
  it('increases pKnown on correct, decreases on slip', () => {
    const p0 = 0.3;
    const p1 = bktUpdate(p0, true, DEFAULT_BKT);
    expect(p1).toBeGreaterThan(p0);
    const p2 = bktUpdate(0.8, false, DEFAULT_BKT);
    expect(p2).toBeLessThan(0.8);
  });

  it('converges toward mastery on a correct streak', () => {
    let p = 0.2;
    for (let i = 0; i < 12; i++) p = bktUpdate(p, true, DEFAULT_BKT);
    expect(bktIsMastered(p)).toBe(true);
  });

  it('predicts floor of pGuess for novice', () => {
    expect(bktPredictCorrect(0, DEFAULT_BKT)).toBeCloseTo(DEFAULT_BKT.pGuess, 3);
  });

  it('priors scale with self-reported level', () => {
    expect(bktPriorForLevel('advanced')).toBeGreaterThan(bktPriorForLevel('beginner'));
  });
});

describe('rating derivation', () => {
  it('wrong answer is always again', () => {
    expect(deriveRating(false, 500, 0)).toBe('again');
    expect(deriveRating(false, 20000, 3)).toBe('again');
  });

  it('fast clean correct is easy', () => {
    expect(deriveRating(true, 2000, 0)).toBe('easy');
  });

  it('slow or hinted correct is hard', () => {
    expect(deriveRating(true, 15000, 0)).toBe('hard');
    expect(deriveRating(true, 3000, 1)).toBe('hard');
  });

  it('normal correct is good', () => {
    expect(deriveRating(true, 7000, 0)).toBe('good');
  });
});

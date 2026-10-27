import { describe, it, expect } from 'vitest';
import {
  calculateRetrievability,
  calculateNextInterval,
  calculateNextReview,
  initializeFSRSNode,
  FSRSNode,
} from './fsrs-scheduler';

const baseNode = (over: Partial<FSRSNode> = {}): FSRSNode => ({
  userId: 'u1',
  courseId: 1,
  conceptId: 'telugu_vocab_greetings',
  conceptType: 'vocabulary',
  stability: 5,
  difficulty: 5,
  retrievability: 0.9,
  lastReviewedAt: new Date(Date.now() - 3 * 86400000),
  dueAt: new Date(Date.now() - 1 * 86400000),
  reps: 3,
  lapses: 0,
  state: 'review',
  ...over,
});

describe('calculateRetrievability', () => {
  it('is ~1.0 at t=0 and decays monotonically', () => {
    const r0 = calculateRetrievability(0, 10);
    const r5 = calculateRetrievability(5, 10);
    const r50 = calculateRetrievability(50, 10);
    expect(r0).toBeCloseTo(1, 1);
    expect(r5).toBeLessThan(r0);
    expect(r50).toBeLessThan(r5);
    expect(r50).toBeGreaterThan(0);
  });

  it('returns 0 for non-positive stability', () => {
    expect(calculateRetrievability(1, 0)).toBe(0);
  });
});

describe('calculateNextInterval', () => {
  it('grows with stability', () => {
    expect(calculateNextInterval(30)).toBeGreaterThan(calculateNextInterval(5));
  });

  it('never returns less than 1 day', () => {
    expect(calculateNextInterval(0.05)).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateNextReview', () => {
  it('"again" lapses: resets stability, bumps difficulty, marks a lapse', () => {
    const node = baseNode();
    const r = calculateNextReview(node, 'again');
    expect(r.nextStability).toBeLessThan(node.stability);
    expect(r.nextDifficulty).toBeGreaterThan(node.difficulty);
    expect(r.nextState).toBe('learning');
  });

  it('"easy" grows stability more than "hard"', () => {
    const node = baseNode();
    const easy = calculateNextReview(node, 'easy');
    const hard = calculateNextReview(node, 'hard');
    expect(easy.nextStability).toBeGreaterThan(hard.nextStability);
    expect(easy.nextDifficulty).toBeLessThan(hard.nextDifficulty);
  });

  it('schedules next due date in the future', () => {
    const r = calculateNextReview(baseNode(), 'good');
    expect(r.nextDueAt.getTime()).toBeGreaterThan(Date.now());
    expect(r.nextInterval).toBeGreaterThanOrEqual(1);
  });
});

describe('initializeFSRSNode', () => {
  it('creates a learning node due tomorrow', () => {
    const n = initializeFSRSNode('u', 1, 'c1', 'vocabulary');
    expect(n.state).toBe('learning');
    expect(n.reps).toBe(0);
    expect(n.dueAt.getTime()).toBeGreaterThan(Date.now());
  });
});

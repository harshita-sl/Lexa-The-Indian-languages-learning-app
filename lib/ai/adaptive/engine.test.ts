import { describe, it, expect } from 'vitest';
import { calculateZPD } from './zpd-calculator';
import { generateAdaptiveSession } from './curriculum-engine';
import { FSRSNode } from './fsrs-scheduler';

const node = (conceptId: string, over: Partial<FSRSNode> = {}): FSRSNode => ({
  userId: 'u',
  courseId: 1,
  conceptId,
  conceptType: 'vocabulary',
  stability: 10,
  difficulty: 5,
  retrievability: 0.95,
  lastReviewedAt: new Date(),
  dueAt: new Date(Date.now() + 86400000),
  reps: 3,
  lapses: 0,
  state: 'review',
  ...over,
});

describe('calculateZPD', () => {
  it('offers no-prerequisite concepts to a brand-new learner', () => {
    const zpd = calculateZPD('telugu', []);
    expect(zpd.length).toBeGreaterThan(0);
    expect(zpd.every((c) => c.concept.prerequisites.length === 0)).toBe(true);
  });

  it('unlocks dependent concepts once prerequisites are mastered', () => {
    const nodes = [
      node('telugu_script_vowels_short', { state: 'mastered', stability: 30, retrievability: 0.95 }),
    ];
    const zpd = calculateZPD('telugu', nodes);
    const ids = zpd.map((c) => c.concept.id);
    expect(ids).toContain('telugu_script_vowels_long');
    expect(ids).toContain('telugu_vocab_greetings');
    // Deep concept stays locked — its prerequisites aren't met
    expect(ids).not.toContain('telugu_syntax_sov');
  });

  it('skips mastered concepts', () => {
    const nodes = [
      node('telugu_script_vowels_short', { state: 'mastered', stability: 60, retrievability: 0.99 }),
    ];
    const ids = calculateZPD('telugu', nodes).map((c) => c.concept.id);
    expect(ids).not.toContain('telugu_script_vowels_short');
  });

  it('every candidate carries an explainable reason', () => {
    const zpd = calculateZPD('telugu', []);
    expect(zpd.every((c) => c.reason.length > 0)).toBe(true);
  });
});

describe('generateAdaptiveSession', () => {
  it('schedules due reviews first when memory is fading', () => {
    const nodes = [
      node('telugu_script_vowels_short', {
        state: 'review',
        stability: 2,
        lastReviewedAt: new Date(Date.now() - 10 * 86400000),
        dueAt: new Date(Date.now() - 86400000),
      }),
    ];
    const plan = generateAdaptiveSession({ language: 'telugu', userNodes: nodes, sessionSize: 5 });
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.distribution.dueReviews).toBeGreaterThan(0);
    expect(plan.steps.every((s) => s.reason.length > 0)).toBe(true);
  });

  it('adds new i+1 concepts once prerequisites are mastered', () => {
    const nodes = [
      node('telugu_script_vowels_short', { state: 'mastered', stability: 40 }),
    ];
    const plan = generateAdaptiveSession({ language: 'telugu', userNodes: nodes, sessionSize: 5 });
    expect(plan.distribution.newConcepts).toBeGreaterThan(0);
  });

  it('falls back to an intro step for empty state', () => {
    const plan = generateAdaptiveSession({ language: 'kannada', userNodes: [], sessionSize: 3 });
    expect(plan.steps.length).toBeGreaterThan(0);
  });
});

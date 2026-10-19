import { describe, it, expect } from 'vitest';
import {
  composeLesson,
  paceTier,
  ComposerRepo,
  BankItemRow,
} from './lesson-composer';
import { initializeFSRSNode } from './fsrs-scheduler';
import type { GeneratedChallenge } from '../types';

const T0 = new Date('2026-01-01T09:00:00Z');
const DAY = 86400000;

function bankRow(id: number, type: string, beta = 950): BankItemRow {
  return {
    id,
    conceptId: 'telugu_vocab_greetings',
    skill: 'vocabulary',
    type,
    difficultyB: beta,
    payload: {
      question: `q${id}`,
      options: [{ text: 'a', correct: true }],
      correctAnswer: 'a',
      explanation: 'e',
      hints: [],
    },
  };
}

function repo(over: Partial<ComposerRepo> = {}): ComposerRepo {
  return {
    getRecentAttempts: async () => [],
    getDeclaredStyle: async () => 'balanced',
    getSkillState: async () => undefined,
    getNodes: async () => [],
    getBankItems: async () => [
      bankRow(1, 'SELECT', 900),
      bankRow(2, 'TRANSLATE', 950),
      bankRow(3, 'ASSIST', 1000),
      bankRow(4, 'ORDER', 1050),
      bankRow(5, 'LISTEN', 1000),
      bankRow(6, 'SELECT', 1100),
    ],
    generateItem: async (input): Promise<GeneratedChallenge> => ({
      question: 'generated',
      type: input.challengeType,
      options: [{ text: 'x', correct: true }],
      correctAnswer: 'x',
      explanation: 'e',
      hints: [],
      difficulty: 5,
      conceptId: input.conceptId,
    }),
    ...over,
  };
}

describe('paceTier', () => {
  it('cold-start (few attempts) is always steady', () => {
    expect(paceTier(1.0, 4)).toBe('steady');
    expect(paceTier(0.2, 0)).toBe('steady');
  });
  it('high accuracy → hot, low → struggling', () => {
    expect(paceTier(0.9, 10)).toBe('hot');
    expect(paceTier(0.4, 10)).toBe('struggling');
    expect(paceTier(0.7, 10)).toBe('steady');
  });
});

describe('composeLesson', () => {
  const base = {
    userId: 'u1',
    courseId: 1,
    conceptId: 'telugu_vocab_greetings',
    language: 'telugu',
  };

  it('fills a steady lesson from the bank first, with reasons', async () => {
    const attempts = Array.from({ length: 10 }, () => ({
      skill: 'vocabulary',
      isCorrect: true,
      latencyMs: 3000,
    }));
    attempts[3].isCorrect = false;
    attempts[6].isCorrect = false;
    const lesson = await composeLesson(
      base,
      repo({ getRecentAttempts: async () => attempts }),
      T0
    );
    expect(lesson.items.length).toBe(5); // steady length
    expect(lesson.items.every((i) => i.source === 'bank')).toBe(true);
    expect(lesson.reasons.length).toBeGreaterThanOrEqual(2);
    expect(lesson.paceTier).toBe('steady');
  });

  it('hot pace produces a longer lesson', async () => {
    const attempts = Array.from({ length: 10 }, () => ({
      skill: 'vocabulary',
      isCorrect: true,
      latencyMs: 2000,
    }));
    const lesson = await composeLesson(
      base,
      repo({ getRecentAttempts: async () => attempts }),
      T0
    );
    expect(lesson.paceTier).toBe('hot');
    expect(lesson.items.length).toBe(6);
  });

  it('struggling pace shortens the lesson and prepends a decayed prerequisite', async () => {
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      skill: 'vocabulary',
      isCorrect: i % 3 === 0,
      latencyMs: 8000,
    }));
    const decayedPrereq = {
      ...initializeFSRSNode('u1', 1, 'telugu_script_vowels_short', 'script'),
      stability: 0.5,
      lastReviewedAt: new Date(T0.getTime() - 20 * DAY),
      dueAt: new Date(T0.getTime() - 10 * DAY),
      reps: 4,
    };
    const lesson = await composeLesson(
      base,
      repo({
        getRecentAttempts: async () => attempts,
        getNodes: async () => [decayedPrereq],
        getBankItems: async (_lang, conceptId) =>
          conceptId === 'telugu_script_vowels_short'
            ? [{ ...bankRow(99, 'SELECT'), conceptId }]
            : [bankRow(1, 'SELECT'), bankRow(2, 'TRANSLATE')],
      }),
      T0
    );
    expect(lesson.paceTier).toBe('struggling');
    expect(lesson.items.length).toBe(3);
    expect(lesson.items[0].conceptId).toBe('telugu_script_vowels_short');
    expect(lesson.reasons.some((r) => /refresher|fading/i.test(r))).toBe(true);
  });

  it('visual style rotates visual-affined item types', async () => {
    const lesson = await composeLesson(
      base,
      repo({
        getDeclaredStyle: async () => 'visual',
        getRecentAttempts: async () => [],
      }),
      T0
    );
    expect(lesson.style).toBe('visual');
    // visual affinity prefers SELECT/MATCH/TRANSLATE/ORDER — no LISTEN/SPEAK
    const types = new Set(lesson.items.map((i) => i.type));
    expect(types.has('SPEAK')).toBe(false);
    expect(types.has('LISTEN')).toBe(false);
  });

  it('cold start with empty bank still returns a lesson via generation', async () => {
    const lesson = await composeLesson(
      base,
      repo({
        getBankItems: async () => [],
        getRecentAttempts: async () => [],
      }),
      T0
    );
    expect(lesson.items.length).toBe(5);
    expect(lesson.items.every((i) => i.source === 'llm')).toBe(true);
  });

  it('generator failure shrinks but never breaks the lesson', async () => {
    const lesson = await composeLesson(
      base,
      repo({
        getBankItems: async () => [bankRow(1, 'SELECT')],
        getRecentAttempts: async () => [],
        generateItem: async () => {
          throw new Error('provider down');
        },
      }),
      T0
    );
    expect(lesson.items.length).toBe(1);
    expect(lesson.items[0].source).toBe('bank');
  });
});

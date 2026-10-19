import { describe, it, expect, vi } from 'vitest';

// Force every LLM call to fail + no cache — exercises the offline fallback
// paths deterministically, which is exactly where the repetition bug lived.
vi.mock('./llm', () => ({
  chatCompletion: vi.fn(async () => {
    throw new Error('no LLM key in tests');
  }),
}));
vi.mock('./cache', () => ({
  getCachedContent: vi.fn(async () => null),
  setCachedContent: vi.fn(async () => {}),
  generateInputHash: vi.fn(() => 'test-hash'),
}));

import {
  generateChallenge,
  generateMultipleChallenges,
  getFallbackChallenge,
} from './challenge-generator';
import { offlineReply } from './chat/offline-dialogues';
import { composeLesson, type ComposerRepo } from './adaptive/lesson-composer';
import { initializeFSRSNode } from './adaptive/fsrs-scheduler';
import type { ChallengeInput, GeneratedChallenge } from './types';

const teluguInput: ChallengeInput = {
  language: 'telugu',
  challengeType: 'SELECT',
  topic: 'greetings',
  difficulty: 'beginner',
  userLevel: 'beginner',
  conceptId: 'telugu_vocab_greetings',
  context: 'lesson test',
};

describe('getFallbackChallenge', () => {
  it('prefers an item matching the requested type', () => {
    const c = getFallbackChallenge('telugu', 'ORDER', { seed: 'x' });
    expect(c.type).toBe('ORDER');
  });

  it('falls back to full pool when the type has no match', () => {
    const c = getFallbackChallenge('telugu', 'MATCH', { seed: 'x' });
    expect(c.question).toBeTruthy();
  });

  it('rotates by seed — different contexts give different items', () => {
    const seen = new Set(
      Array.from({ length: 8 }, (_, i) => getFallbackChallenge('telugu', 'SELECT', { seed: `ctx_${i}` }).question)
    );
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  it('honors exclude — never returns an excluded question', () => {
    const first = getFallbackChallenge('telugu', 'SELECT', { seed: 'a' });
    const exclude = new Set([first.question]);
    const second = getFallbackChallenge('telugu', 'SELECT', { seed: 'a', exclude });
    expect(second.question).not.toBe(first.question);
  });
});

describe('generateChallenge offline', () => {
  it('returns a fallback with conceptId stamped', async () => {
    const c = await generateChallenge(teluguInput);
    expect(c.question).toBeTruthy();
    expect(c.conceptId).toBe('telugu_vocab_greetings');
  });
});

describe('generateMultipleChallenges offline — the repetition regression', () => {
  it('returns at least 3 distinct questions for telugu', async () => {
    const list = await generateMultipleChallenges(teluguInput, 5);
    expect(list).toHaveLength(5);
    const unique = new Set(list.map((c) => c.question));
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });

  it('returns at least 3 distinct questions for kannada', async () => {
    const list = await generateMultipleChallenges({ ...teluguInput, language: 'kannada' }, 5);
    const unique = new Set(list.map((c) => c.question));
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });

  it('sequential single-slot calls also vary (different contexts)', async () => {
    const qs = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const c = await generateChallenge({ ...teluguInput, context: `slot_${i}` });
      qs.add(c.question);
    }
    expect(qs.size).toBeGreaterThanOrEqual(3);
  });
});

describe('offline dialogues', () => {
  it('advances by turn index — never repeats consecutive lines', () => {
    const t0 = offlineReply('telugu', 'auto', 0);
    const t1 = offlineReply('telugu', 'auto', 1);
    const t2 = offlineReply('telugu', 'auto', 2);
    expect(t0.native).not.toBe(t1.native);
    expect(t1.native).not.toBe(t2.native);
  });

  it('is in-character per scenario', () => {
    const auto = offlineReply('telugu', 'auto', 0);
    const food = offlineReply('telugu', 'food', 0);
    expect(auto.native).not.toBe(food.native);
  });

  it('clamps past the end instead of crashing', () => {
    const t = offlineReply('telugu', 'auto', 99);
    expect(t.native).toBeTruthy();
  });
});

describe('lesson composer — question dedupe', () => {
  const T0 = new Date('2026-01-01T09:00:00Z');
  function repo(genItems: GeneratedChallenge[]): ComposerRepo {
    let i = 0;
    return {
      getRecentAttempts: async () => [],
      getDeclaredStyle: async () => 'balanced',
      getSkillState: async () => undefined,
      getNodes: async () => [
        initializeFSRSNode('u1', 1, 'telugu_vocab_greetings', 'vocabulary'),
      ],
      getBankItems: async () => [],
      generateItem: async () => genItems[i++] ?? genItems[genItems.length - 1],
    };
  }
  const dup: GeneratedChallenge = {
    question: 'same question', type: 'SELECT',
    options: [{ text: 'a', correct: true }], correctAnswer: 'a',
    explanation: 'e', hints: [], difficulty: 1,
  };
  const other: GeneratedChallenge = { ...dup, question: 'different question' };

  it('skips generated items whose question repeats in the lesson', async () => {
    const r = await composeLesson(
      { userId: 'u1', courseId: 1, conceptId: 'telugu_vocab_greetings', language: 'telugu' },
      repo([dup, other, dup, other, dup, other]),
      T0
    );
    const questions = r.items.map((it) => (it.payload as { question?: string }).question);
    expect(new Set(questions).size).toBe(questions.length);
    expect(questions).toContain('same question');
    expect(questions).toContain('different question');
  });
});

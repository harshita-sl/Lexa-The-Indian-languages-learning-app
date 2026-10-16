import { describe, it, expect } from 'vitest';
import { recordAttempt } from './learner-model';
import { createMemoryStore, memoryLearnerRepo, memoryPlanRepo } from './memory-repo';
import { buildDailyPlan } from './daily-plan';
import { selectTasks } from './task-selector';
import {
  initPlacementState,
  nextPlacementItem,
  recordPlacementAnswer,
  placementDone,
  finalizePlacement,
  PlacementItem,
} from './placement';
import { runSimulation } from './simulator';
import { FSRSNode, initializeFSRSNode } from './fsrs-scheduler';

const DAY = 86400000;
const T0 = new Date('2026-01-01T09:00:00Z');

function baseAttempt(over: Partial<Parameters<typeof recordAttempt>[0]> = {}) {
  return {
    userId: 'u1',
    courseId: 1,
    conceptId: 'telugu_vocab_greetings',
    conceptType: 'vocabulary' as const,
    skill: 'vocabulary' as const,
    correct: true,
    userAnswer: 'నమస్కారం',
    latencyMs: 3000,
    hintsUsed: 0,
    source: 'lesson' as const,
    language: 'telugu',
    now: T0,
    ...over,
  };
}

describe('recordAttempt pipeline', () => {
  it('creates node, skill row, and session row on first attempt', async () => {
    const store = createMemoryStore(T0);
    const repo = memoryLearnerRepo(store);
    const res = await recordAttempt(baseAttempt(), repo);

    expect(res.rating).toBe('easy'); // fast correct
    expect(store.nodes.size).toBe(1);
    expect(store.sessions.length).toBe(1);
    expect(store.sessions[0].source).toBe('lesson');
    const skill = store.skills.get('u1:1:vocabulary');
    expect(skill).toBeDefined();
    expect(skill!.attempts).toBe(1);
    expect(skill!.elo).not.toBe(1000);
  });

  it('lapse on wrong answer lowers stability and bumps lapses', async () => {
    const store = createMemoryStore(T0);
    const repo = memoryLearnerRepo(store);
    await recordAttempt(baseAttempt(), repo);
    const res2 = await recordAttempt(
      baseAttempt({ correct: false, userAnswer: 'x', expectedAnswer: 'నమస్కారం', now: new Date(T0.getTime() + DAY) }),
      repo
    );
    expect(res2.rating).toBe('again');
    const node = store.nodes.get('u1:1:telugu_vocab_greetings')!;
    expect(node.lapses).toBe(1);
    expect(node.state).toBe('learning');
  });

  it('updates granular item node when itemKey given', async () => {
    const store = createMemoryStore(T0);
    const repo = memoryLearnerRepo(store);
    await recordAttempt(
      baseAttempt({ itemKey: 'telugu_vocab_greetings:namaskaram', itemType: 'word' }),
      repo
    );
    expect(store.items.has('u1:telugu_vocab_greetings:namaskaram')).toBe(true);
  });

  it('marks served recommendation completed', async () => {
    const store = createMemoryStore(T0);
    const repo = memoryLearnerRepo(store);
    const planRepo = memoryPlanRepo(store);
    await planRepo.logRecommendations('u1', 1, [
      { type: 'fsrs_review', conceptId: 'telugu_vocab_greetings', title: 't', skill: 'vocabulary', reason: 'due', etaMinutes: 2 },
    ]);
    await recordAttempt(baseAttempt(), repo);
    expect(store.recommendations[0].completedAt).not.toBeNull();
  });
});

describe('selectTasks', () => {
  const now = T0;
  const overdueNode: FSRSNode = {
    ...initializeFSRSNode('u1', 1, 'telugu_script_vowels_short', 'script'),
    stability: 2,
    lastReviewedAt: new Date(T0.getTime() - 4 * DAY),
    dueAt: new Date(T0.getTime() - DAY),
    reps: 3,
  };

  it('surfaces overdue reviews with a decay reason', () => {
    const tasks = selectTasks({
      language: 'telugu',
      nodes: [overdueNode],
      count: 6,
      includeConversation: false,
      now,
    });
    const review = tasks.find((t) => t.type === 'fsrs_review');
    expect(review).toBeDefined();
    expect(review!.reason).toMatch(/memory at/i);
  });

  it('a truly faded memory outranks new concepts', () => {
    const faded: FSRSNode = {
      ...overdueNode,
      stability: 0.5,
      lastReviewedAt: new Date(T0.getTime() - 30 * DAY),
      dueAt: new Date(T0.getTime() - 20 * DAY),
    };
    const tasks = selectTasks({
      language: 'telugu',
      nodes: [faded],
      count: 3,
      includeConversation: false,
      now,
    });
    expect(tasks[0].type).toBe('fsrs_review');
    expect(tasks[0].reason).toMatch(/overdue/i);
  });

  it('unlocks ZPD concept when prerequisites are solid', () => {
    const strong: FSRSNode = {
      ...overdueNode,
      stability: 30,
      lastReviewedAt: new Date(T0.getTime() - DAY),
      dueAt: new Date(T0.getTime() + 10 * DAY),
      state: 'mastered',
      reps: 6,
    };
    const tasks = selectTasks({
      language: 'telugu',
      nodes: [strong],
      count: 5,
      includeConversation: false,
      now,
    });
    const zpd = tasks.find((t) => t.type === 'zpd_new');
    expect(zpd).toBeDefined();
    expect(zpd!.scores.zpdReadiness).toBeGreaterThan(0);
  });

  it('appends a conversation step when nodes exist', () => {
    const tasks = selectTasks({ language: 'telugu', nodes: [overdueNode], count: 4, now });
    expect(tasks.some((t) => t.type === 'conversation')).toBe(true);
  });
});

describe('buildDailyPlan', () => {
  it('sizes plan from daily goal and logs reasons', async () => {
    const store = createMemoryStore(T0);
    store.goalMinutes.set('u1', 20);
    // mastered prereq + one due node → mix of reviews, ZPD, conversation
    store.nodes.set('u1:1:telugu_script_vowels_short', {
      userId: 'u1',
      courseId: 1,
      conceptId: 'telugu_script_vowels_short',
      conceptType: 'script',
      stability: 30,
      difficulty: 3,
      retrievability: 0.97,
      lastReviewedAt: new Date(T0.getTime() - DAY),
      dueAt: new Date(T0.getTime() + 10 * DAY),
      reps: 6,
      lapses: 0,
      state: 'mastered',
    });
    store.nodes.set('u1:1:telugu_script_vowels_long', {
      userId: 'u1',
      courseId: 1,
      conceptId: 'telugu_script_vowels_long',
      conceptType: 'script',
      stability: 2,
      difficulty: 5,
      retrievability: 0.6,
      lastReviewedAt: new Date(T0.getTime() - 4 * DAY),
      dueAt: new Date(T0.getTime() - DAY),
      reps: 3,
      lapses: 0,
      state: 'review',
    });
    const plan = await buildDailyPlan('u1', 1, memoryPlanRepo(store), T0);
    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
    expect(plan.steps.every((s) => s.reason.length > 0)).toBe(true);
    expect(store.recommendations.length).toBe(plan.steps.length);
  });
});

describe('placement', () => {
  const pool: PlacementItem[] = [600, 800, 1000, 1200, 1400].map((b, i) => ({
    id: i,
    conceptId: `c${i}`,
    skill: 'vocabulary',
    difficultyB: b,
  }));

  it('picks item closest to theta, then converges', () => {
    let state = initPlacementState('intermediate'); // theta 1000
    const first = nextPlacementItem(pool, state)!;
    expect(first.difficultyB).toBe(1000);
    state = recordPlacementAnswer(state, {
      itemId: first.id, conceptId: first.conceptId, skill: 'vocabulary', difficultyB: first.difficultyB, correct: true,
    });
    const second = nextPlacementItem(pool, state)!;
    expect(second.difficultyB).toBeGreaterThan(1000);
  });

  it('finishes within MAX items and returns level + seeded concepts', () => {
    let state = initPlacementState('beginner');
    let guard = 0;
    while (!placementDone(state) && guard++ < 20) {
      const item = nextPlacementItem(pool, state);
      if (!item) break;
      state = recordPlacementAnswer(state, {
        itemId: item.id, conceptId: item.conceptId, skill: 'vocabulary',
        difficultyB: item.difficultyB, correct: item.difficultyB < 950,
      });
    }
    const res = finalizePlacement(state);
    expect(['beginner', 'intermediate', 'advanced']).toContain(res.level);
    expect(res.passedConcepts.length).toBeGreaterThan(0);
  });
});

describe('simulator smoke', () => {
  it('runs a 7-day cohort without errors and returns metrics', async () => {
    const { results, cohortMAE } = await runSimulation(7);
    expect(results.length).toBe(3);
    expect(cohortMAE).toBeGreaterThanOrEqual(0);
    expect(results[0].days.length).toBe(7);
  }, 20000);
});

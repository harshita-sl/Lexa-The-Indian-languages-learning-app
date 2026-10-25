/**
 * Style- & pace-adaptive lesson composer.
 *
 * For a target concept, produces an ordered item list whose *types* match the
 * learner's effective style and whose *length + difficulty ramp* match the
 * pace tier derived from rolling accuracy:
 *
 *   hot        (acc ≥ 0.85) → longer lesson, steeper ramp, new-material bias
 *   steady     (0.6–0.85)   → baseline
 *   struggling (< 0.6)      → shorter lesson, gentler ramp, a decayed
 *                             prerequisite review prepended
 *
 * Items fill from the practice_items bank first (typed + beta-matched), then
 * the LLM generator (cached, unreviewed) for gaps. Repo-injectable so the
 * whole composer runs offline in tests.
 */

import { Skill, SkillAbility, conceptTypeToSkill, BASELINE_ELO } from './ability';
import { getConceptById } from './knowledge-graph';
import {
  computeStyle,
  STYLE_TYPE_AFFINITY,
  LearningStyle,
  SessionEvidence,
} from './style-inference';
import { FSRSNode, calculateRetrievability } from './fsrs-scheduler';
import type { ChallengeInput, GeneratedChallenge } from '../types';

export type PaceTier = 'hot' | 'steady' | 'struggling';
export type ChallengeType = ChallengeInput['challengeType'];

// Types that render inside a lesson (CONVERSATION lives in /chat).
const LESSON_TYPES: ChallengeType[] = [
  'SELECT',
  'ASSIST',
  'TRANSLATE',
  'MATCH',
  'ORDER',
  'SPEAK',
  'LISTEN',
];

export interface BankItemRow {
  id: number;
  conceptId: string;
  skill: string;
  type: string;
  difficultyB: number;
  payload: unknown;
}

export interface ComposedItem {
  conceptId: string;
  type: ChallengeType;
  difficultyB: number;
  payload: Record<string, unknown>;
  source: 'bank' | 'llm';
  itemId: number | string;
}

export interface ComposedLesson {
  conceptId: string;
  language: string;
  style: LearningStyle;
  paceTier: PaceTier;
  rollingAccuracy: number;
  items: ComposedItem[];
  reasons: string[];
}

export interface ComposerRepo {
  getRecentAttempts(userId: string, limit: number): Promise<SessionEvidence[]>;
  getDeclaredStyle(userId: string): Promise<string | null>;
  getSkillState(
    userId: string,
    courseId: number,
    skill: Skill
  ): Promise<SkillAbility | undefined>;
  getNodes(userId: string, courseId: number): Promise<FSRSNode[]>;
  getBankItems(language: string, conceptId: string): Promise<BankItemRow[]>;
  /** Injected generator — keeps the composer offline-testable. */
  generateItem(input: ChallengeInput): Promise<GeneratedChallenge>;
}

export function paceTier(rollingAccuracy: number, attempts: number): PaceTier {
  if (attempts < 5) return 'steady'; // not enough signal yet
  if (rollingAccuracy >= 0.85) return 'hot';
  if (rollingAccuracy < 0.6) return 'struggling';
  return 'steady';
}

const LENGTH: Record<PaceTier, number> = { hot: 6, steady: 5, struggling: 3 };
const START_BETA_OFFSET: Record<PaceTier, number> = {
  hot: -50,
  steady: -100,
  struggling: -200,
};

export async function composeLesson(
  input: {
    userId: string;
    courseId: number;
    conceptId: string;
    language: string;
    userLevel?: string;
  },
  repo: ComposerRepo,
  now: Date = new Date()
): Promise<ComposedLesson> {
  const { userId, courseId, conceptId, language } = input;
  const concept = getConceptById(conceptId);
  const skill = concept ? conceptTypeToSkill(concept.type) : 'vocabulary';

  const [attempts, declared, skillState, nodes, bank] = await Promise.all([
    repo.getRecentAttempts(userId, 20),
    repo.getDeclaredStyle(userId),
    repo.getSkillState(userId, courseId, skill),
    repo.getNodes(userId, courseId),
    repo.getBankItems(language.toLowerCase(), conceptId),
  ]);

  const style = computeStyle(declared, attempts).effective;
  const acc =
    attempts.length > 0
      ? attempts.filter((a) => a.isCorrect).length / attempts.length
      : 0.75; // neutral prior — no evidence
  const tier = paceTier(acc, attempts.length);
  const theta = skillState?.elo ?? BASELINE_ELO;

  const length = Math.min(7, Math.max(3, LENGTH[tier]));
  const startBeta = theta + START_BETA_OFFSET[tier];
  const endBeta = theta + 50;

  const affinity = STYLE_TYPE_AFFINITY[style].filter((t) =>
    LESSON_TYPES.includes(t)
  );
  const items: ComposedItem[] = [];
  const usedBankIds = new Set<number>();
  const usedQuestions = new Set<string>();
  const reasons: string[] = [
    `Style: ${style}${declared && declared !== style ? ` (inferred over declared "${declared}")` : ''}`,
    `Pace: ${tier} — ${Math.round(acc * 100)}% over last ${attempts.length} attempts`,
  ];

  // Struggling: prepend a decayed-prerequisite review item.
  if (tier === 'struggling') {
    const review = pickDecayedPrereq(conceptId, nodes, now);
    if (review) {
      const reviewBank = await repo.getBankItems(language.toLowerCase(), review);
      const row = closestByBeta(reviewBank, theta - 200);
      if (row) {
        usedBankIds.add(row.id);
        items.push({
          conceptId: review,
          type: (row.type as ChallengeType) ?? 'SELECT',
          difficultyB: row.difficultyB,
          payload: row.payload as Record<string, unknown>,
          source: 'bank',
          itemId: row.id,
        });
        reasons.push(
          `Prerequisite refresher first — ${getConceptById(review)?.label ?? review} is fading`
        );
      }
    }
  }

  // Revisited concept → reserve one mid-lesson slot for a freshly
  // generated item so repeat visits aren't the same bank set again.
  const revisited = nodes.some(
    (n) => n.conceptId === conceptId && n.reps > 0
  );
  const freshSlot = revisited ? Math.min(1, length - 1) : -1;
  // Generation cache keys include context — the day bucket gives a fresh
  // item per day while still deduping same-day repeats.
  const dayBucket = now.toISOString().slice(0, 10);

  // Fill from the bank, rotating style-affined types.
  for (let i = items.length; i < length; i++) {
    const targetBeta = startBeta + ((endBeta - startBeta) * i) / Math.max(length - 1, 1);
    const wantType = affinity[i % affinity.length];
    const typed = bank.filter(
      (r) => !usedBankIds.has(r.id) && r.type === wantType
    );
    // Style affinity is a preference, not a hard filter — but honor it
    // before falling back to any remaining type.
    const affined = bank.filter(
      (r) => !usedBankIds.has(r.id) && affinity.includes(r.type as typeof affinity[number])
    );
    // A style without speech affinity never gets speech items — a visual
    // learner shouldn't be handed LISTEN just because the bank ran out.
    const noSpeechStyle = !affinity.includes('LISTEN') && !affinity.includes('SPEAK');
    const rest = bank.filter(
      (r) =>
        !usedBankIds.has(r.id) &&
        (!noSpeechStyle || (r.type !== 'LISTEN' && r.type !== 'SPEAK'))
    );
    const row = pickByBeta(
      typed.length ? typed : affined.length ? affined : rest,
      targetBeta
    );

    const preferGen = i === freshSlot;
    if (row && !preferGen) {
      usedBankIds.add(row.id);
      const q = (row.payload as { question?: string }).question;
      if (q) usedQuestions.add(q);
      items.push({
        conceptId,
        type: (row.type as ChallengeType) ?? 'SELECT',
        difficultyB: row.difficultyB,
        payload: row.payload as Record<string, unknown>,
        source: 'bank',
        itemId: row.id,
      });
      continue;
    }

    // Bank exhausted (or the fresh revisit slot) → LLM generation.
    try {
      const gen = await repo.generateItem({
        language,
        topic: concept?.label ?? conceptId,
        difficulty: tier === 'hot' ? 'advanced' : tier === 'struggling' ? 'beginner' : 'intermediate',
        challengeType: wantType,
        userLevel: input.userLevel ?? 'beginner',
        conceptId,
        context: `lesson:${conceptId}:slot${i}:${dayBucket}`,
      });
      // Generator echoed a question already in this lesson → fall back to
      // the bank pick rather than shrink the lesson.
      if (usedQuestions.has(gen.question)) {
        if (!row) continue;
      } else {
        usedQuestions.add(gen.question);
        items.push({
          conceptId,
          type: gen.type ?? wantType,
          difficultyB: targetBeta,
          payload: gen as unknown as Record<string, unknown>,
          source: 'llm',
          itemId: `llm_${conceptId}_${i}`,
        });
        continue;
      }
    } catch {
      // Generator failed — fall back to the bank pick if we have one.
      if (!row) continue;
    }

    usedBankIds.add(row!.id);
    const q = (row!.payload as { question?: string }).question;
    if (q) usedQuestions.add(q);
    items.push({
      conceptId,
      type: (row!.type as ChallengeType) ?? 'SELECT',
      difficultyB: row!.difficultyB,
      payload: row!.payload as Record<string, unknown>,
      source: 'bank',
      itemId: row!.id,
    });
  }

  return {
    conceptId,
    language,
    style,
    paceTier: tier,
    rollingAccuracy: Math.round(acc * 100) / 100,
    items,
    reasons,
  };
}

function closestByBeta(rows: BankItemRow[], beta: number): BankItemRow | undefined {
  if (rows.length === 0) return undefined;
  return rows.reduce((a, b) =>
    Math.abs(b.difficultyB - beta) < Math.abs(a.difficultyB - beta) ? b : a
  );
}

/**
 * Difficulty-matched but varied: pick randomly among the 3 closest-β
 * candidates so revisits don't re-serve the identical best match.
 */
function pickByBeta(rows: BankItemRow[], beta: number): BankItemRow | undefined {
  if (rows.length === 0) return undefined;
  const ranked = [...rows].sort(
    (a, b) => Math.abs(a.difficultyB - beta) - Math.abs(b.difficultyB - beta)
  );
  return ranked[Math.floor(Math.random() * Math.min(3, ranked.length))];
}

/** A decayed prerequisite of conceptId, if any — the thing to refresh first. */
function pickDecayedPrereq(
  conceptId: string,
  nodes: FSRSNode[],
  now: Date
): string | null {
  const concept = getConceptById(conceptId);
  if (!concept || !nodes.length) return null;
  let best: { id: string; r: number } | null = null;
  for (const prereq of concept.prerequisites ?? []) {
    const node = nodes.find((n) => n.conceptId === prereq);
    if (!node) continue;
    const days = (now.getTime() - node.lastReviewedAt.getTime()) / 86400000;
    const r = calculateRetrievability(days, node.stability);
    if (r < 0.8 && (!best || r < best.r)) best = { id: prereq, r };
  }
  return best?.id ?? null;
}

// ── Drizzle-backed default repo ─────────────────────────────────────────────

export function drizzleComposerRepo(): ComposerRepo {
  const getDb = async () => (await import('@/db/drizzle')).default;
  const getSchema = async () => await import('@/db/schema');
  const getOrm = async () => await import('drizzle-orm');

  return {
    async getRecentAttempts(userId, limit) {
      const [db, s, { eq, desc }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const rows = await db.query.learnerSessions.findMany({
        where: eq(s.learnerSessions.userId, userId),
        orderBy: [desc(s.learnerSessions.createdAt)],
        limit,
      });
      return rows.map((r) => ({
        skill: r.skill,
        isCorrect: r.isCorrect,
        latencyMs: r.latencyMs,
      }));
    },
    async getDeclaredStyle(userId) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(s.userPreferences.userId, userId),
      });
      return prefs?.learningStyle ?? 'balanced';
    },
    async getSkillState(userId, courseId, skill) {
      const [db, s, { and, eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const row = await db.query.learnerSkillState.findFirst({
        where: and(
          eq(s.learnerSkillState.userId, userId),
          eq(s.learnerSkillState.courseId, courseId),
          eq(s.learnerSkillState.skill, skill)
        ),
      });
      return row ? { elo: row.elo, attempts: row.attempts, correct: row.correct } : undefined;
    },
    async getNodes(userId, courseId) {
      const [db, s, { and, eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const rows = await db.query.learnerKnowledgeNodes.findMany({
        where: and(
          eq(s.learnerKnowledgeNodes.userId, userId),
          eq(s.learnerKnowledgeNodes.courseId, courseId)
        ),
      });
      const now = new Date();
      return rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        courseId: n.courseId,
        conceptId: n.conceptId,
        conceptType: n.conceptType as FSRSNode['conceptType'],
        stability: n.stability,
        difficulty: n.difficulty,
        retrievability: n.retrievability,
        lastReviewedAt: n.lastReviewedAt ?? now,
        dueAt: n.dueAt ?? now,
        reps: n.reps,
        lapses: n.lapses,
        state: n.state as FSRSNode['state'],
      }));
    },
    async getBankItems(language, conceptId) {
      const [db, s, { and, eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const rows = await db.query.practiceItems.findMany({
        where: and(
          eq(s.practiceItems.language, language),
          eq(s.practiceItems.conceptId, conceptId)
        ),
      });
      return rows.map((r) => ({
        id: r.id,
        conceptId: r.conceptId,
        skill: r.skill,
        type: r.type,
        difficultyB: r.difficultyB,
        payload: r.payload,
      }));
    },
    async generateItem(input) {
      const { generateChallenge } = await import('../challenge-generator');
      return generateChallenge(input);
    },
  };
}

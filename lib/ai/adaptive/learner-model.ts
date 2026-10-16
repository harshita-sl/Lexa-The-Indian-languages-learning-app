/**
 * Learner Model — the single write path for every observed attempt.
 *
 * lesson / practice / placement / chat all funnel through recordAttempt():
 *   answer → auto-derived FSRS rating → concept node update
 *          → granular item node update (words, slang)
 *          → per-skill Elo + BKT update
 *          → learner_sessions evidence row
 *          → recommendation_log completion
 *
 * The repo is injectable so engine logic stays unit-testable without a DB.
 */

import {
  calculateNextReview,
  initializeFSRSNode,
  ReviewRating,
} from './fsrs-scheduler';
import {
  updateAbility,
  eloToLevel,
  BASELINE_ELO,
  Skill,
} from './ability';
import { bktUpdate, bktPriorForLevel, DEFAULT_BKT } from './bkt';
import { diagnoseIndicError, ErrorDiagnosis } from '../indic/error-diagnoser';
import type { ConceptType } from './knowledge-graph';

export const FAST_CORRECT_MS = 4000;
export const SLOW_MS = 12000;

export interface AttemptInput {
  userId: string;
  courseId: number;
  conceptId: string;
  conceptType?: ConceptType;
  itemKey?: string;
  itemType?: 'word' | 'phrase' | 'slang';
  skill: Skill;
  correct: boolean;
  userAnswer: string;
  expectedAnswer?: string;
  challengeId?: string;
  latencyMs?: number;
  hintsUsed?: number;
  source: 'lesson' | 'practice' | 'chat' | 'placement';
  taskReason?: string;
  language?: string;
  targetRegister?: 'intimate' | 'informal' | 'formal' | 'honorific';
  /** Simulated clock for tests/simulator; defaults to real time. */
  now?: Date;
}

export interface AttemptResult {
  rating: ReviewRating;
  diagnosis: ErrorDiagnosis | null;
  concept: {
    stability: number;
    difficulty: number;
    dueAt: Date;
    state: string;
  };
  skill: {
    skill: Skill;
    elo: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    bktKnown: number;
  };
}

/** Auto-derived FSRS rating from outcome + latency + hints. */
export function deriveRating(
  correct: boolean,
  latencyMs = 0,
  hintsUsed = 0
): ReviewRating {
  if (!correct) return 'again';
  if (hintsUsed > 0 || latencyMs > SLOW_MS) return 'hard';
  if (latencyMs > 0 && latencyMs < FAST_CORRECT_MS) return 'easy';
  return 'good';
}

// ── Repository abstraction ──────────────────────────────────────────────────

export interface KnowledgeNodeRecord {
  id?: number;
  userId: string;
  courseId: number;
  conceptId: string;
  conceptType: string;
  stability: number;
  difficulty: number;
  retrievability: number;
  lastReviewedAt: Date;
  dueAt: Date;
  reps: number;
  lapses: number;
  state: string;
}

export interface ItemRecord extends Omit<KnowledgeNodeRecord, 'conceptType'> {
  itemKey: string;
  itemType: string;
}

export interface SkillRecord {
  id?: number;
  userId: string;
  courseId: number;
  skill: string;
  elo: number;
  bktKnown: number;
  attempts: number;
  correct: number;
}

export interface LearnerRepo {
  getNode(userId: string, courseId: number, conceptId: string): Promise<KnowledgeNodeRecord | undefined>;
  upsertNode(node: KnowledgeNodeRecord): Promise<void>;
  getItem(userId: string, itemKey: string): Promise<ItemRecord | undefined>;
  upsertItem(item: ItemRecord): Promise<void>;
  getSkill(userId: string, courseId: number, skill: string): Promise<SkillRecord | undefined>;
  upsertSkill(skill: SkillRecord & { bktLearn?: number; bktGuess?: number; bktSlip?: number }): Promise<void>;
  logSession(row: {
    userId: string;
    courseId: number;
    challengeId: string;
    conceptId: string;
    itemId?: string;
    skill?: string;
    source: string;
    taskReason?: string;
    userAnswer: string;
    isCorrect: boolean;
    latencyMs: number;
    hintsUsed: number;
    errorClassification: string;
    explanation?: string;
  }): Promise<void>;
  completeRecommendation(userId: string, courseId: number, conceptId: string): Promise<void>;
  getSelfReportedLevel?(userId: string): Promise<string>;
}

// ── Core pipeline ───────────────────────────────────────────────────────────

export async function recordAttempt(
  input: AttemptInput,
  repo: LearnerRepo
): Promise<AttemptResult> {
  const now = input.now ?? new Date();
  const rating = deriveRating(input.correct, input.latencyMs ?? 0, input.hintsUsed ?? 0);

  // 1. Diagnose the error (only meaningful on wrong text answers)
  let diagnosis: ErrorDiagnosis | null = null;
  if (!input.correct && input.expectedAnswer && input.language) {
    diagnosis = diagnoseIndicError({
      userInput: input.userAnswer,
      expectedAnswer: input.expectedAnswer,
      language: input.language,
      targetRegister: input.targetRegister,
    });
  }

  // 2. FSRS update on the concept node
  const existing = await repo.getNode(input.userId, input.courseId, input.conceptId);
  const node = existing ?? {
    ...initializeFSRSNode(
      input.userId,
      input.courseId,
      input.conceptId,
      input.conceptType ?? 'vocabulary'
    ),
    // backdate so elapsed time is real on first review
    lastReviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  };
  const next = calculateNextReview(
    {
      ...node,
      conceptType: (node.conceptType ?? 'vocabulary') as never,
      state: node.state as 'learning' | 'review' | 'mastered',
    },
    rating,
    input.latencyMs ?? 0,
    now
  );
  await repo.upsertNode({
    ...node,
    conceptType: input.conceptType ?? node.conceptType ?? 'vocabulary',
    stability: next.nextStability,
    difficulty: next.nextDifficulty,
    retrievability: next.nextRetrievability,
    lastReviewedAt: now,
    dueAt: next.nextDueAt,
    reps: rating === 'again' ? node.reps : node.reps + 1,
    lapses: rating === 'again' ? node.lapses + 1 : node.lapses,
    state: next.nextState,
  });

  // 3. Granular item node (word/phrase/slang) when provided
  if (input.itemKey) {
    const existingItem = await repo.getItem(input.userId, input.itemKey);
    const item = existingItem ?? {
      ...initializeFSRSNode(input.userId, input.courseId, input.conceptId, 'vocabulary'),
      itemKey: input.itemKey,
      itemType: input.itemType ?? 'word',
      lastReviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    };
    const itemNext = calculateNextReview(
      {
        ...item,
        conceptType: 'vocabulary',
        state: item.state as 'learning' | 'review' | 'mastered',
      },
      rating,
      input.latencyMs ?? 0,
      now
    );
    await repo.upsertItem({
      ...item,
      itemKey: input.itemKey,
      itemType: input.itemType ?? item.itemType ?? 'word',
      stability: itemNext.nextStability,
      difficulty: itemNext.nextDifficulty,
      retrievability: itemNext.nextRetrievability,
      lastReviewedAt: now,
      dueAt: itemNext.nextDueAt,
      reps: rating === 'again' ? item.reps : item.reps + 1,
      lapses: rating === 'again' ? item.lapses + 1 : item.lapses,
      state: itemNext.nextState,
    });
  }

  // 4. Skill state: Elo + BKT
  const skillRow = await repo.getSkill(input.userId, input.courseId, input.skill);
  const prior = skillRow?.bktKnown ??
    bktPriorForLevel((await repo.getSelfReportedLevel?.(input.userId)) ?? 'beginner');
  const { ability } = updateAbility(
    {
      elo: skillRow?.elo ?? BASELINE_ELO,
      attempts: skillRow?.attempts ?? 0,
      correct: skillRow?.correct ?? 0,
    },
    itemBetaForConcept(input),
    input.correct
  );
  const bktKnown = bktUpdate(prior, input.correct, DEFAULT_BKT);
  await repo.upsertSkill({
    id: skillRow?.id,
    userId: input.userId,
    courseId: input.courseId,
    skill: input.skill,
    elo: ability.elo,
    bktKnown,
    attempts: ability.attempts,
    correct: ability.correct,
  });

  // 5. Evidence log + recommendation completion
  await repo.logSession({
    userId: input.userId,
    courseId: input.courseId,
    challengeId: input.challengeId ?? input.itemKey ?? input.conceptId,
    conceptId: input.conceptId,
    itemId: input.itemKey,
    skill: input.skill,
    source: input.source,
    taskReason: input.taskReason,
    userAnswer: input.userAnswer,
    isCorrect: input.correct,
    latencyMs: input.latencyMs ?? 0,
    hintsUsed: input.hintsUsed ?? 0,
    errorClassification: diagnosis?.dimension ?? 'none',
    explanation: diagnosis?.explanation,
  });
  await repo.completeRecommendation(input.userId, input.courseId, input.conceptId);

  return {
    rating,
    diagnosis,
    concept: {
      stability: next.nextStability,
      difficulty: next.nextDifficulty,
      dueAt: next.nextDueAt,
      state: next.nextState,
    },
    skill: {
      skill: input.skill,
      elo: ability.elo,
      level: eloToLevel(ability.elo),
      bktKnown,
    },
  };
}

/** Item difficulty proxy from concept level when no measured beta exists. */
function itemBetaForConcept(input: AttemptInput): number {
  // Concept level (1-5) maps onto the Elo scale around baseline 1000.
  const level = input.conceptId ? conceptLevelHint(input.conceptId) : 1;
  return BASELINE_ELO + (level - 3) * 150;
}

function conceptLevelHint(_conceptId: string): number {
  // Kept simple: callers may pass richer item beta later; default level 2.
  return 2;
}

// ── Drizzle-backed default repo (lazy import keeps unit tests DB-free) ──────

export function drizzleLearnerRepo(): LearnerRepo {
  const getDb = async () => (await import('@/db/drizzle')).default;
  const getSchema = async () => await import('@/db/schema');

  return {
    async getNode(userId, courseId, conceptId) {
      const [db, s, { and, eq }] = await Promise.all([
        getDb(),
        getSchema(),
        import('drizzle-orm'),
      ]);
      const row = await db.query.learnerKnowledgeNodes.findFirst({
        where: and(
          eq(s.learnerKnowledgeNodes.userId, userId),
          eq(s.learnerKnowledgeNodes.courseId, courseId),
          eq(s.learnerKnowledgeNodes.conceptId, conceptId)
        ),
      });
      return row
        ? {
            ...row,
            lastReviewedAt: row.lastReviewedAt ?? new Date(),
            dueAt: row.dueAt ?? new Date(),
          }
        : undefined;
    },
    async upsertNode(node) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      if (node.id) {
        await db
          .update(s.learnerKnowledgeNodes)
          .set({
            stability: node.stability,
            difficulty: node.difficulty,
            retrievability: node.retrievability,
            lastReviewedAt: node.lastReviewedAt,
            dueAt: node.dueAt,
            reps: node.reps,
            lapses: node.lapses,
            state: node.state,
          })
          .where(eq(s.learnerKnowledgeNodes.id, node.id));
      } else {
        await db
          .insert(s.learnerKnowledgeNodes)
          .values({ ...node, id: undefined })
          .onConflictDoUpdate({
            target: [
              s.learnerKnowledgeNodes.userId,
              s.learnerKnowledgeNodes.courseId,
              s.learnerKnowledgeNodes.conceptId,
            ],
            set: {
              stability: node.stability,
              difficulty: node.difficulty,
              retrievability: node.retrievability,
              lastReviewedAt: node.lastReviewedAt,
              dueAt: node.dueAt,
              reps: node.reps,
              lapses: node.lapses,
              state: node.state,
            },
          });
      }
    },
    async getItem(userId, itemKey) {
      const [db, s, { and, eq }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      const row = await db.query.learnerItems.findFirst({
        where: and(
          eq(s.learnerItems.userId, userId),
          eq(s.learnerItems.itemKey, itemKey)
        ),
      });
      return row
        ? { ...row, lastReviewedAt: row.lastReviewedAt ?? new Date(), dueAt: row.dueAt ?? new Date() }
        : undefined;
    },
    async upsertItem(item) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      const set = {
        stability: item.stability,
        difficulty: item.difficulty,
        retrievability: item.retrievability,
        lastReviewedAt: item.lastReviewedAt,
        dueAt: item.dueAt,
        reps: item.reps,
        lapses: item.lapses,
        state: item.state,
      };
      if (item.id) {
        await db.update(s.learnerItems).set(set).where(eq(s.learnerItems.id, item.id));
      } else {
        await db
          .insert(s.learnerItems)
          .values({ ...item, id: undefined })
          .onConflictDoUpdate({ target: [s.learnerItems.userId, s.learnerItems.itemKey], set });
      }
    },
    async getSkill(userId, courseId, skill) {
      const [db, s, { and, eq }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      return db.query.learnerSkillState.findFirst({
        where: and(
          eq(s.learnerSkillState.userId, userId),
          eq(s.learnerSkillState.courseId, courseId),
          eq(s.learnerSkillState.skill, skill)
        ),
      });
    },
    async upsertSkill(skill) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      const set = {
        elo: skill.elo,
        bktKnown: skill.bktKnown,
        attempts: skill.attempts,
        correct: skill.correct,
        lastSeenAt: new Date(),
      };
      if (skill.id) {
        await db.update(s.learnerSkillState).set(set).where(eq(s.learnerSkillState.id, skill.id));
      } else {
        await db
          .insert(s.learnerSkillState)
          .values({ ...skill, id: undefined })
          .onConflictDoUpdate({
            target: [s.learnerSkillState.userId, s.learnerSkillState.courseId, s.learnerSkillState.skill],
            set,
          });
      }
    },
    async logSession(row) {
      const [db, s] = await Promise.all([getDb(), getSchema()]);
      await db.insert(s.learnerSessions).values(row);
    },
    async completeRecommendation(userId, courseId, conceptId) {
      const [db, s, { and, eq, isNull }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      await db
        .update(s.recommendationLog)
        .set({ completedAt: new Date() })
        .where(
          and(
            eq(s.recommendationLog.userId, userId),
            eq(s.recommendationLog.courseId, courseId),
            eq(s.recommendationLog.conceptId, conceptId),
            isNull(s.recommendationLog.completedAt)
          )
        );
    },
    async getSelfReportedLevel(userId) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), import('drizzle-orm')]);
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(s.userPreferences.userId, userId),
      });
      return prefs?.currentLevel ?? 'beginner';
    },
  };
}

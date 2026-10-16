/**
 * Daily personalized plan composer.
 *
 * Sizes the session from the learner's daily-goal minutes, mixes due reviews /
 * new ZPD concepts / remediation / one conversation challenge via
 * selectTasks(), and logs every step to recommendation_log for explainability.
 */

import { selectTasks, ScoredTask } from './task-selector';
import { calculateRetrievability, FSRSNode } from './fsrs-scheduler';
import { Skill, SkillAbility } from './ability';
import { ErrorDimension } from '../indic/error-diagnoser';

export interface PlanStep {
  type: ScoredTask['type'];
  conceptId: string;
  title: string;
  skill: Skill;
  reason: string;
  etaMinutes: number;
}

export interface DailyPlan {
  userId: string;
  courseId: number;
  language: string;
  date: string; // YYYY-MM-DD
  estMinutes: number;
  steps: PlanStep[];
}

export interface PlanRepo {
  getNodes(userId: string, courseId: number): Promise<FSRSNode[]>;
  getSkillStates(
    userId: string,
    courseId: number
  ): Promise<Partial<Record<Skill, SkillAbility>>>;
  getRecentErrorDims(userId: string, limit?: number): Promise<ErrorDimension[]>;
  getDailyGoalMinutes(userId: string): Promise<number>;
  getLanguageForCourse(courseId: number): Promise<string>;
  logRecommendations(
    userId: string,
    courseId: number,
    steps: PlanStep[]
  ): Promise<void>;
}

const MIN_STEPS = 4;
const MAX_STEPS = 12;
const MIN_PER_ITEM = 2;

export async function buildDailyPlan(
  userId: string,
  courseId: number,
  repo: PlanRepo,
  now: Date = new Date()
): Promise<DailyPlan> {
  const [nodes, skillStates, errorDims, goalMinutes, language] = await Promise.all([
    repo.getNodes(userId, courseId),
    repo.getSkillStates(userId, courseId),
    repo.getRecentErrorDims(userId),
    repo.getDailyGoalMinutes(userId),
    repo.getLanguageForCourse(courseId),
  ]);

  const stepCount = Math.min(
    MAX_STEPS,
    Math.max(MIN_STEPS, Math.round(goalMinutes / MIN_PER_ITEM))
  );

  const scored = selectTasks({
    language,
    nodes: refreshRetrievability(nodes, now),
    skillStates,
    recentErrorDims: errorDims,
    count: stepCount,
    now,
  });

  const steps: PlanStep[] = scored.map((t) => ({
    type: t.type,
    conceptId: t.conceptId,
    title: t.label,
    skill: t.skill,
    reason: t.reason,
    etaMinutes: t.type === 'conversation' ? 5 : MIN_PER_ITEM,
  }));

  await repo.logRecommendations(userId, courseId, steps).catch(() => {
    // logging must never break plan delivery
  });

  const estMinutes = steps.reduce((a, s) => a + s.etaMinutes, 0);
  return {
    userId,
    courseId,
    language,
    date: now.toISOString().slice(0, 10),
    estMinutes,
    steps,
  };
}

/** Refresh node retrievability to now (rows store last-computed R). */
function refreshRetrievability(nodes: FSRSNode[], now: Date): FSRSNode[] {
  return nodes.map((n) => {
    const daysSince = (now.getTime() - n.lastReviewedAt.getTime()) / 86400000;
    return { ...n, retrievability: calculateRetrievability(daysSince, n.stability) };
  });
}

// ── Drizzle-backed default repo ─────────────────────────────────────────────

export function drizzlePlanRepo(): PlanRepo {
  const getDb = async () => (await import('@/db/drizzle')).default;
  const getSchema = async () => await import('@/db/schema');
  const getOrm = async () => await import('drizzle-orm');

  return {
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
    async getSkillStates(userId, courseId) {
      const [db, s, { and, eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const rows = await db.query.learnerSkillState.findMany({
        where: and(
          eq(s.learnerSkillState.userId, userId),
          eq(s.learnerSkillState.courseId, courseId)
        ),
      });
      const out: Partial<Record<Skill, SkillAbility>> = {};
      for (const r of rows) {
        out[r.skill as Skill] = { elo: r.elo, attempts: r.attempts, correct: r.correct };
      }
      return out;
    },
    async getRecentErrorDims(userId, limit = 20) {
      const [db, s, { eq, desc }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const rows = await db.query.learnerSessions.findMany({
        where: eq(s.learnerSessions.userId, userId),
        orderBy: [desc(s.learnerSessions.createdAt)],
        limit,
      });
      return rows
        .map((r) => r.errorClassification)
        .filter((d): d is ErrorDimension => Boolean(d) && d !== 'none') as ErrorDimension[];
    },
    async getDailyGoalMinutes(userId) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(s.userPreferences.userId, userId),
      });
      return prefs?.dailyGoalMinutes ?? 15;
    },
    async getLanguageForCourse(courseId) {
      const [db, s, { eq }] = await Promise.all([getDb(), getSchema(), getOrm()]);
      const course = await db.query.courses.findFirst({ where: eq(s.courses.id, courseId) });
      return (course?.title ?? 'Telugu').toLowerCase();
    },
    async logRecommendations(userId, courseId, steps) {
      const [db, s] = await Promise.all([getDb(), getSchema()]);
      if (steps.length === 0) return;
      await db.insert(s.recommendationLog).values(
        steps.map((st) => ({
          userId,
          courseId,
          taskType: st.type,
          conceptId: st.conceptId,
          reason: st.reason,
        }))
      );
    },
  };
}

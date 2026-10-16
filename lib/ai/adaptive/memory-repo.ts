/**
 * In-memory LearnerRepo + PlanRepo implementations.
 *
 * Used by unit tests and the offline learner simulator — they exercise the
 * exact recordAttempt() / buildDailyPlan() code paths that production runs
 * against Postgres, without needing a database.
 */

import {
  LearnerRepo,
  KnowledgeNodeRecord,
  ItemRecord,
  SkillRecord,
} from './learner-model';
import { PlanRepo, PlanStep } from './daily-plan';
import { FSRSNode } from './fsrs-scheduler';
import { Skill, SkillAbility } from './ability';
import { ErrorDimension } from '../indic/error-diagnoser';

interface SessionRow {
  userId: string;
  courseId: number;
  conceptId: string;
  skill?: string;
  source: string;
  isCorrect: boolean;
  errorClassification: string;
  createdAt: Date;
}

export interface MemoryStore {
  nodes: Map<string, KnowledgeNodeRecord>;
  items: Map<string, ItemRecord>;
  skills: Map<string, SkillRecord>;
  sessions: SessionRow[];
  recommendations: { userId: string; courseId: number; conceptId: string | null; reason: string; completedAt: Date | null }[];
  levels: Map<string, string>;
  goalMinutes: Map<string, number>;
  languages: Map<number, string>;
  now: Date; // simulated clock
}

export function createMemoryStore(now = new Date()): MemoryStore {
  return {
    nodes: new Map(),
    items: new Map(),
    skills: new Map(),
    sessions: [],
    recommendations: [],
    levels: new Map(),
    goalMinutes: new Map(),
    languages: new Map([[1, 'telugu'], [2, 'hindi'], [3, 'kannada']]),
    now,
  };
}

export function memoryLearnerRepo(store: MemoryStore): LearnerRepo {
  let idSeq = 1;
  return {
    async getNode(userId, courseId, conceptId) {
      return store.nodes.get(`${userId}:${courseId}:${conceptId}`);
    },
    async upsertNode(node) {
      const key = `${node.userId}:${node.courseId}:${node.conceptId}`;
      const existing = store.nodes.get(key);
      store.nodes.set(key, { ...node, id: existing?.id ?? idSeq++ });
    },
    async getItem(userId, itemKey) {
      return store.items.get(`${userId}:${itemKey}`);
    },
    async upsertItem(item) {
      const key = `${item.userId}:${item.itemKey}`;
      const existing = store.items.get(key);
      store.items.set(key, { ...item, id: existing?.id ?? idSeq++ });
    },
    async getSkill(userId, courseId, skill) {
      return store.skills.get(`${userId}:${courseId}:${skill}`);
    },
    async upsertSkill(skill) {
      const key = `${skill.userId}:${skill.courseId}:${skill.skill}`;
      const existing = store.skills.get(key);
      store.skills.set(key, { ...skill, id: existing?.id ?? idSeq++ });
    },
    async logSession(row) {
      store.sessions.push({ ...row, createdAt: new Date(store.now) });
    },
    async completeRecommendation(userId, courseId, conceptId) {
      const rec = store.recommendations.find(
        (r) => r.userId === userId && r.courseId === courseId && r.conceptId === conceptId && !r.completedAt
      );
      if (rec) rec.completedAt = new Date(store.now);
    },
    async getSelfReportedLevel(userId) {
      return store.levels.get(userId) ?? 'beginner';
    },
  };
}

export function memoryPlanRepo(store: MemoryStore): PlanRepo {
  return {
    async getNodes(userId, courseId) {
      const nodes: FSRSNode[] = [];
      for (const n of store.nodes.values()) {
        if (n.userId === userId && n.courseId === courseId) {
          nodes.push({
            id: n.id,
            userId: n.userId,
            courseId: n.courseId,
            conceptId: n.conceptId,
            conceptType: (n.conceptType as FSRSNode['conceptType']) ?? 'vocabulary',
            stability: n.stability,
            difficulty: n.difficulty,
            retrievability: n.retrievability,
            lastReviewedAt: n.lastReviewedAt,
            dueAt: n.dueAt,
            reps: n.reps,
            lapses: n.lapses,
            state: n.state as FSRSNode['state'],
          });
        }
      }
      return nodes;
    },
    async getSkillStates(userId, courseId) {
      const out: Partial<Record<Skill, SkillAbility>> = {};
      for (const s of store.skills.values()) {
        if (s.userId === userId && s.courseId === courseId) {
          out[s.skill as Skill] = { elo: s.elo, attempts: s.attempts, correct: s.correct };
        }
      }
      return out;
    },
    async getRecentErrorDims(userId, limit = 20) {
      return store.sessions
        .filter((s) => s.userId === userId)
        .slice(-limit)
        .map((s) => s.errorClassification)
        .filter((d): d is ErrorDimension => Boolean(d) && d !== 'none');
    },
    async getDailyGoalMinutes(userId) {
      return store.goalMinutes.get(userId) ?? 15;
    },
    async getLanguageForCourse(courseId) {
      return store.languages.get(courseId) ?? 'telugu';
    },
    async logRecommendations(userId, courseId, steps: PlanStep[]) {
      for (const st of steps) {
        store.recommendations.push({
          userId,
          courseId,
          conceptId: st.conceptId,
          reason: st.reason,
          completedAt: null,
        });
      }
    },
  };
}

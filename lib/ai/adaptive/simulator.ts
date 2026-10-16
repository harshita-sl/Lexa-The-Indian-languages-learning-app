/**
 * Synthetic learner simulator — tunes and validates the engine offline.
 *
 * A synthetic learner has:
 *   - a hidden true ability theta* per skill (drifts up with exposure)
 *   - a hidden true memory strength per concept (decays exponentially,
 *     refreshed on successful reviews)
 *   - a per-day engagement pattern
 *
 * Each simulated day we run the REAL pipeline: buildDailyPlan() over the
 * memory repo, then recordAttempt() with the learner's simulated response.
 * Afterwards we measure whether the model's estimates track the truth.
 */

import { recordAttempt } from './learner-model';
import { buildDailyPlan } from './daily-plan';
import { expectedScore, Skill } from './ability';
import { conceptBeta } from './task-selector';
import { getConceptById } from './knowledge-graph';
import {
  createMemoryStore,
  memoryLearnerRepo,
  memoryPlanRepo,
  MemoryStore,
} from './memory-repo';

export interface SimLearnerSpec {
  id: string;
  trueTheta: number; // hidden ability, same Elo-ish scale
  learningRate: number; // theta gain per correct attempt
  forgetting: number; // daily decay of true memory (0..1)
  selfLevel: 'beginner' | 'intermediate' | 'advanced';
  daysActive: number; // fraction 0..1 of days the learner shows up
}

export interface SimDayMetrics {
  day: number;
  tasksServed: number;
  reviewAccuracy: number | null; // actual correct rate on review tasks
  predictedMeanR: number; // model's mean predicted retrievability on reviews
  abilityEstimate: number; // mean elo across touched skills
  masteredConcepts: number;
}

export interface CalibrationBin {
  lo: number;
  hi: number;
  count: number;
  predictedMean: number;
  actualRate: number;
}

export interface SimResult {
  learnerId: string;
  days: SimDayMetrics[];
  calibrationMAE: number; // mean |predictedR - actualRecall| on reviews
  calibrationBins: CalibrationBin[]; // binned predicted-vs-actual (ECE view)
  abilityBias: number; // final mean elo - trueTheta
  planFillRate: number; // fraction of plan steps actually attempted
}

interface TrueMemory {
  strength: number; // days half-life-ish
  lastSeen: number; // sim day
}

function trueRetention(mem: TrueMemory | undefined, day: number): number {
  if (!mem) return 0;
  const dt = day - mem.lastSeen;
  return Math.pow(0.5, dt / Math.max(0.5, mem.strength));
}

/** Deterministic-ish RNG so reports are reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function simulateLearner(
  spec: SimLearnerSpec,
  days = 30,
  seed = 42,
  language = 'telugu',
  courseId = 1
): Promise<SimResult> {
  const rand = mulberry32(seed);
  const store: MemoryStore = createMemoryStore(new Date('2026-01-01T09:00:00Z'));
  store.levels.set(spec.id, spec.selfLevel);
  store.languages.set(courseId, language);
  const learnerRepo = memoryLearnerRepo(store);
  const planRepo = memoryPlanRepo(store);

  // Hidden truth
  const trueTheta = new Map<Skill, number>();
  const trueMem = new Map<string, TrueMemory>();
  let theta = spec.trueTheta;

  const dayMetrics: SimDayMetrics[] = [];
  const calibErrors: number[] = [];
  const calibPairs: { predicted: number; actual: number }[] = [];
  let served = 0;
  let attempted = 0;

  for (let day = 0; day < days; day++) {
    const now = new Date(store.now.getTime() + 0); // anchored at store.now
    store.now = now;

    const active = rand() < spec.daysActive;
    if (!active) {
      dayMetrics.push({
        day,
        tasksServed: 0,
        reviewAccuracy: null,
        predictedMeanR: 0,
        abilityEstimate: meanTheta(trueTheta),
        masteredConcepts: masteredCount(store),
      });
      store.now = new Date(store.now.getTime() + 86400000);
      continue;
    }

    const plan = await buildDailyPlan(spec.id, courseId, planRepo, now);
    served += plan.steps.length;
    attempted += plan.steps.length;

    // Predicted R on review steps before answering
    const reviewSteps = plan.steps.filter((s) => s.type === 'fsrs_review');
    let correctReviews = 0;
    const predictedRs: number[] = [];

    for (const step of plan.steps) {
      const concept = getConceptById(step.conceptId);
      const skill: Skill = step.skill ?? 'vocabulary';
      const conceptType = concept?.type ?? 'vocabulary';
      const beta = concept ? conceptBeta(concept.level) : 1000;
      const thetaSkill = trueTheta.get(skill) ?? theta;

      // Simulated recall: ability + true memory decay
      const mem = trueMem.get(step.conceptId);
      const ret = step.type === 'zpd_new' ? 0.35 : trueRetention(mem, day);
      const pCorrect = Math.min(
        0.97,
        Math.max(0.03, expectedScore(thetaSkill, beta) * 0.6 + ret * 0.5)
      );
      const correct = rand() < pCorrect;

      if (step.type === 'fsrs_review') {
        const node = store.nodes.get(`${spec.id}:${courseId}:${step.conceptId}`);
        if (node) {
          const daysSince = (now.getTime() - node.lastReviewedAt.getTime()) / 86400000;
          const predictedR = Math.pow(
            1 + 0.19 * (daysSince / Math.max(0.1, node.stability)),
            -0.5
          );
          predictedRs.push(predictedR);
          calibErrors.push(Math.abs(predictedR - (correct ? 1 : 0)));
          calibPairs.push({ predicted: predictedR, actual: correct ? 1 : 0 });
        }
        if (correct) correctReviews++;
      }

      await recordAttempt(
        {
          userId: spec.id,
          courseId,
          conceptId: step.conceptId,
          conceptType,
          skill,
          correct,
          userAnswer: correct ? 'ok' : 'wrong',
          latencyMs: 2000 + rand() * 9000,
          hintsUsed: rand() < 0.15 ? 1 : 0,
          source: 'lesson',
          taskReason: step.reason,
          language,
          now,
        },
        learnerRepo
      );

      // Truth updates: memory refreshes + ability drifts
      trueMem.set(step.conceptId, {
        strength: Math.min(60, (mem?.strength ?? 0.8) * (correct ? 2.2 : 1.2)),
        lastSeen: day,
      });
      const gain = correct ? spec.learningRate : spec.learningRate * 0.3;
      trueTheta.set(skill, Math.min(1600, thetaSkill + gain));
      theta = Math.min(1600, theta + gain * 0.5);
    }

    const estimated = meanSkillElo(store, spec.id, courseId);
    dayMetrics.push({
      day,
      tasksServed: plan.steps.length,
      reviewAccuracy: reviewSteps.length ? correctReviews / reviewSteps.length : null,
      predictedMeanR: predictedRs.length
        ? predictedRs.reduce((a, b) => a + b, 0) / predictedRs.length
        : 0,
      abilityEstimate: estimated,
      masteredConcepts: masteredCount(store),
    });

    // Advance to next day
    store.now = new Date(store.now.getTime() + 86400000);
  }

  const calibrationMAE = calibErrors.length
    ? calibErrors.reduce((a, b) => a + b, 0) / calibErrors.length
    : 0;
  const finalEstimate = meanSkillElo(store, spec.id, courseId);
  return {
    learnerId: spec.id,
    days: dayMetrics,
    calibrationMAE: Math.round(calibrationMAE * 1000) / 1000,
    calibrationBins: binCalibration(calibPairs),
    abilityBias: Math.round(finalEstimate - meanTheta(trueTheta)),
    planFillRate: served ? attempted / served : 0,
  };
}

/** 5-bin expected-calibration table for predicted retrievability vs recall. */
export function binCalibration(
  pairs: { predicted: number; actual: number }[]
): CalibrationBin[] {
  const bins: CalibrationBin[] = [0, 0.2, 0.4, 0.6, 0.8].map((lo) => ({
    lo,
    hi: lo + 0.2,
    count: 0,
    predictedMean: 0,
    actualRate: 0,
  }));
  for (const { predicted, actual } of pairs) {
    const i = Math.min(4, Math.floor(predicted / 0.2));
    const b = bins[i];
    b.count++;
    b.predictedMean += predicted;
    b.actualRate += actual;
  }
  for (const b of bins) {
    if (b.count > 0) {
      b.predictedMean = Math.round((b.predictedMean / b.count) * 100) / 100;
      b.actualRate = Math.round((b.actualRate / b.count) * 100) / 100;
    }
  }
  return bins;
}

function meanTheta(map: Map<Skill, number>): number {
  if (!map.size) return 0;
  return [...map.values()].reduce((a, b) => a + b, 0) / map.size;
}

function meanSkillElo(store: MemoryStore, userId: string, courseId: number): number {
  const elos: number[] = [];
  for (const s of store.skills.values()) {
    if (s.userId === userId && s.courseId === courseId) elos.push(s.elo);
  }
  return elos.length ? elos.reduce((a, b) => a + b, 0) / elos.length : 0;
}

function masteredCount(store: MemoryStore): number {
  let n = 0;
  for (const node of store.nodes.values()) {
    if (node.state === 'mastered') n++;
  }
  return n;
}

/** Standard battery: weak/average/strong learners × engagement levels. */
export const SIM_COHORT: SimLearnerSpec[] = [
  { id: 'sim_strong', trueTheta: 1100, learningRate: 8, forgetting: 0.05, selfLevel: 'intermediate', daysActive: 0.9 },
  { id: 'sim_average', trueTheta: 950, learningRate: 5, forgetting: 0.08, selfLevel: 'beginner', daysActive: 0.75 },
  { id: 'sim_weak', trueTheta: 750, learningRate: 3, forgetting: 0.15, selfLevel: 'beginner', daysActive: 0.5 },
];

export async function runSimulation(
  days = 30
): Promise<{ results: SimResult[]; cohortMAE: number }> {
  const results: SimResult[] = [];
  let i = 0;
  for (const spec of SIM_COHORT) {
    results.push(await simulateLearner(spec, days, 42 + i * 7));
    i++;
  }
  const cohortMAE =
    results.reduce((a, r) => a + r.calibrationMAE, 0) / results.length;
  return { results, cohortMAE: Math.round(cohortMAE * 1000) / 1000 };
}

/**
 * Adaptive placement test — item-response-style adaptive selection.
 *
 * Starts at the middle of the difficulty pool and, after each answer, updates
 * theta (Elo) and picks the unseen item whose beta is closest to theta
 * (maximum-information point: ~50% expected success). Stops after
 * MAX_PLACEMENT_ITEMS or when theta stabilises.
 */

import {
  SkillAbility,
  updateAbility,
  eloToLevel,
  BASELINE_ELO,
} from './ability';
import { bktPriorForLevel } from './bkt';
import { Skill } from './ability';

export interface PlacementItem {
  id: number | string;
  conceptId: string;
  skill: Skill;
  difficultyB: number;
}

export interface PlacementAnswer {
  itemId: number | string;
  conceptId: string;
  skill: Skill;
  difficultyB: number;
  correct: boolean;
}

export interface PlacementState {
  theta: number;
  perSkill: Partial<Record<Skill, SkillAbility>>;
  answers: PlacementAnswer[];
}

export const MAX_PLACEMENT_ITEMS = 8;
const STABLE_WINDOW = 3;
const STABLE_DELTA = 25;

export function initPlacementState(selfLevel: string): PlacementState {
  const theta =
    selfLevel === 'advanced' ? 1150 : selfLevel === 'intermediate' ? 1000 : 850;
  return { theta, perSkill: {}, answers: [] };
}

/** Pick the most informative next item: beta closest to current theta. */
export function nextPlacementItem(
  pool: PlacementItem[],
  state: PlacementState
): PlacementItem | null {
  const answeredIds = new Set(state.answers.map((a) => a.itemId));
  const answeredConcepts = new Set(state.answers.map((a) => a.conceptId));
  const candidates = pool.filter(
    (i) => !answeredIds.has(i.id) && !answeredConcepts.has(i.conceptId)
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) =>
    Math.abs(c.difficultyB - state.theta) < Math.abs(best.difficultyB - state.theta)
      ? c
      : best
  );
}

export function recordPlacementAnswer(
  state: PlacementState,
  answer: PlacementAnswer
): PlacementState {
  const prev = state.perSkill[answer.skill] ?? {
    elo: state.theta,
    attempts: 0,
    correct: 0,
  };
  const { ability } = updateAbility(prev, answer.difficultyB, answer.correct);
  const perSkill = { ...state.perSkill, [answer.skill]: ability };
  // Global theta = mean of per-skill elos (skills the user touched)
  const elos = Object.values(perSkill).map((s) => s!.elo);
  const theta = elos.length ? elos.reduce((a, b) => a + b, 0) / elos.length : state.theta;
  return { theta, perSkill, answers: [...state.answers, answer] };
}

export function placementDone(state: PlacementState): boolean {
  if (state.answers.length >= MAX_PLACEMENT_ITEMS) return true;
  if (state.answers.length >= STABLE_WINDOW) {
    // Stabilised: last few items all answered correctly at similar difficulty
    const recent = state.answers.slice(-STABLE_WINDOW);
    const spread =
      Math.max(...recent.map((a) => a.difficultyB)) -
      Math.min(...recent.map((a) => a.difficultyB));
    const allCorrect = recent.every((a) => a.correct);
    const allWrong = recent.every((a) => !a.correct);
    if ((allCorrect || allWrong) && spread < STABLE_DELTA) return true;
  }
  return false;
}

export interface PlacementResult {
  level: 'beginner' | 'intermediate' | 'advanced';
  theta: number;
  perSkill: Partial<Record<Skill, SkillAbility>>;
  passedConcepts: string[]; // concepts demonstrated correct → seed as known
}

export function finalizePlacement(state: PlacementState): PlacementResult {
  const level = eloToLevel(state.theta);
  const passedConcepts = [
    ...new Set(state.answers.filter((a) => a.correct).map((a) => a.conceptId)),
  ];
  return { level, theta: state.theta, perSkill: state.perSkill, passedConcepts };
}

/** BKT prior to seed per-skill rows after placement. */
export function placementBktPrior(level: string): number {
  return bktPriorForLevel(level);
}

export { BASELINE_ELO };

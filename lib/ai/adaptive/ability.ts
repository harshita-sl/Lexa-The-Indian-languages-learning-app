/**
 * Elo-lite ability estimation.
 *
 * Each skill (vocabulary, script, listening, speaking, grammar, conversation)
 * carries a learner rating theta (~Elo scale, baseline 1000) and every
 * practice item carries a difficulty beta on the same scale.
 *
 * P(correct) = 1 / (1 + 10^(-(theta - beta) / 400))
 *
 * The learner's rating adapts faster than item difficulty (K=48→16 decaying),
 * and items self-calibrate slowly from aggregate outcomes. This is a heuristic
 * approximation of 1PL/Rasch — honest, interpretable, zero dependencies.
 */

export const SKILL_KEYS = [
  'vocabulary',
  'script',
  'listening',
  'speaking',
  'grammar',
  'conversation',
] as const;

export type Skill = (typeof SKILL_KEYS)[number];

export interface SkillAbility {
  elo: number;
  attempts: number;
  correct: number;
}

export const BASELINE_ELO = 1000;

export function expectedScore(theta: number, beta: number): number {
  return 1 / (1 + Math.pow(10, -(theta - beta) / 400));
}

/** K-factor decays as evidence accumulates (provisional → established). */
export function kFactor(attempts: number): number {
  if (attempts < 10) return 48;
  if (attempts < 25) return 32;
  return 16;
}

const ITEM_K = 12; // items calibrate slower than learners

export function updateAbility(
  state: SkillAbility,
  itemBeta: number,
  correct: boolean
): { ability: SkillAbility; itemBeta: number } {
  const e = expectedScore(state.elo, itemBeta);
  const s = correct ? 1 : 0;
  const k = kFactor(state.attempts);
  return {
    ability: {
      elo: clamp(state.elo + k * (s - e), 400, 1800),
      attempts: state.attempts + 1,
      correct: state.correct + (correct ? 1 : 0),
    },
    itemBeta: clamp(itemBeta - ITEM_K * (s - e), -400, 1600),
  };
}

export function eloToLevel(elo: number): 'beginner' | 'intermediate' | 'advanced' {
  if (elo < 900) return 'beginner';
  if (elo < 1100) return 'intermediate';
  return 'advanced';
}

/**
 * Item difficulty targeting ~75% success (Vygotsky zone: challenging but
 * attainable). Solving P=0.75 for beta gives beta = theta - 190.8.
 */
export function targetItemBeta(theta: number, targetSuccess = 0.75): number {
  return theta + 400 * Math.log10((1 - targetSuccess) / targetSuccess);
}

/** 0 at |beta-theta|=800+, 1 when item difficulty exactly matches ability. */
export function eloProximity(theta: number, beta: number): number {
  return Math.max(0, 1 - Math.abs(beta - targetItemBeta(theta)) / 400);
}

/** Concept type → skill dimension mapping. */
export function conceptTypeToSkill(
  conceptType: string
): Skill {
  switch (conceptType) {
    case 'script':
      return 'script';
    case 'vocabulary':
      return 'vocabulary';
    case 'grammar_rule':
    case 'syntax':
      return 'grammar';
    case 'honorific':
      return 'conversation'; // register/pragmatics exercised in conversation
    default:
      return 'vocabulary';
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

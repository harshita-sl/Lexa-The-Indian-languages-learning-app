/**
 * Bayesian Knowledge Tracing (BKT) — per-skill mastery estimate.
 *
 * Classic 4-parameter model:
 *   pKnown : probability the skill is mastered
 *   pLearn : probability of learning the skill per practice opportunity
 *   pGuess : probability of a correct answer without mastery
 *   pSlip  : probability of a wrong answer despite mastery
 *
 * Deliberately chosen over neural KT (DKT/SAKT): interpretable parameters,
 * meaningful cold-start priors, and no training-data requirement (ADR-0003).
 */

export interface BKTParams {
  pLearn: number;
  pGuess: number;
  pSlip: number;
}

export const DEFAULT_BKT: BKTParams = {
  pLearn: 0.15,
  pGuess: 0.22,
  pSlip: 0.10,
};

/** Cold-start prior from the learner's self-reported level. */
export function bktPriorForLevel(
  level: 'beginner' | 'intermediate' | 'advanced' | string
): number {
  switch (level) {
    case 'advanced':
      return 0.65;
    case 'intermediate':
      return 0.45;
    default:
      return 0.2;
  }
}

/** Posterior probability of knowing the skill after observing an answer. */
export function bktUpdate(
  pKnown: number,
  correct: boolean,
  params: BKTParams = DEFAULT_BKT
): number {
  const { pLearn, pGuess, pSlip } = params;
  const k = clamp(pKnown);
  const posterior = correct
    ? (k * (1 - pSlip)) / (k * (1 - pSlip) + (1 - k) * pGuess)
    : (k * pSlip) / (k * pSlip + (1 - k) * (1 - pGuess));
  // Learning transition: opportunity to learn on each attempt.
  return clamp(posterior + (1 - posterior) * pLearn);
}

/** Probability the next answer will be correct. */
export function bktPredictCorrect(
  pKnown: number,
  params: BKTParams = DEFAULT_BKT
): number {
  return clamp(pKnown) * (1 - params.pSlip) + (1 - clamp(pKnown)) * params.pGuess;
}

export const BKT_MASTERY_THRESHOLD = 0.95;

export function bktIsMastered(pKnown: number): boolean {
  return pKnown >= BKT_MASTERY_THRESHOLD;
}

function clamp(v: number): number {
  return Math.min(0.9999, Math.max(0.0001, v));
}

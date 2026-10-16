/**
 * FSRS (Free Spaced Repetition Scheduler) Engine
 * Implements mathematically precise spaced repetition for long-term memory retention:
 * - Stability (S): Expected days until retrievability drops to 0.9
 * - Difficulty (D): Inherent difficulty of the concept (1-10 scale)
 * - Retrievability R(t,S) = (1 + 0.19 * t/S)^(-0.5)
 * - Next review interval I = (S / 0.19) * (R_target^(-2) - 1)
 */

export interface FSRSNode {
  id?: number;
  userId: string;
  courseId: number;
  conceptId: string;
  conceptType: 'vocabulary' | 'grammar_rule' | 'honorific' | 'script' | 'syntax';
  stability: number; // S in days
  difficulty: number; // D (1-10)
  retrievability: number; // R (0.0-1.0)
  lastReviewedAt: Date;
  dueAt: Date;
  reps: number;
  lapses: number;
  state: 'learning' | 'review' | 'mastered';
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

interface ReviewResult {
  nextStability: number;
  nextDifficulty: number;
  nextRetrievability: number;
  nextDueAt: Date;
  nextInterval: number; // days
  nextState: 'learning' | 'review' | 'mastered';
}

// FSRS Algorithm Constants
const DECAY_INTERCEPT = 0.19; // Controls the retrievability decay rate
const RETRIEVABILITY_EXPONENT = -0.5; // Power for forgetting curve
const TARGET_RETRIEVABILITY = 0.90; // Target R when scheduling next review
const MIN_STABILITY = 0.1; // Minimum stability (days)
const MAX_STABILITY = 36500; // Maximum stability (~100 years)
const STABILITY_GAIN_FACTOR = 1.5; // Multiplicative gain on correct review
const DIFFICULTY_STEP = 0.5; // Difficulty adjustment increment

/**
 * Calculate retrievability at time t given stability S
 * R(t, S) = (1 + DECAY_INTERCEPT * t / S) ^ RETRIEVABILITY_EXPONENT
 */
export function calculateRetrievability(
  daysSinceLastReview: number,
  stability: number
): number {
  if (stability <= 0) return 0;
  const ratio = daysSinceLastReview / stability;
  const R = Math.pow(1 + DECAY_INTERCEPT * ratio, RETRIEVABILITY_EXPONENT);
  return Math.max(0, Math.min(1, R));
}

/**
 * Calculate the next review interval (days) to reach target retrievability
 * I = (S / DECAY_INTERCEPT) * (R_target^(-2) - 1)
 */
export function calculateNextInterval(
  stability: number,
  targetRetrievability: number = TARGET_RETRIEVABILITY
): number {
  if (stability <= 0) return 1;
  const interval =
    (stability / DECAY_INTERCEPT) *
    (Math.pow(targetRetrievability, -2) - 1);
  return Math.max(1, Math.round(interval));
}

/**
 * Update stability after a review
 * If recalled correctly: S' = S * gain_factor * adjustment
 * If forgotten (lapse): S' = S_min * D^(-0.3)
 */
function updateStability(
  currentStability: number,
  currentDifficulty: number,
  currentRetrievability: number,
  rating: ReviewRating
): number {
  let newStability: number;

  if (rating === 'again') {
    // Lapse: reset to minimum stability scaled by difficulty
    newStability = MIN_STABILITY * Math.pow(currentDifficulty, -0.3);
  } else {
    // Successful recall: increase stability
    let gain = STABILITY_GAIN_FACTOR;

    // Rating modifiers
    if (rating === 'easy') {
      gain *= 1.3; // 30% bonus for "easy" recall
    } else if (rating === 'hard') {
      gain *= 0.85; // 15% penalty for "hard" recall
    }

    // Difficulty adjustment (easier concepts gain stability faster)
    const difficultyAdjust = Math.pow(currentDifficulty, -0.2);

    // Retrievability adjustment (reviewing just before forgetting = higher gain)
    const retrievabilityBonus = Math.exp(0.5 * (1 - currentRetrievability));

    newStability = currentStability * gain * difficultyAdjust * retrievabilityBonus;
  }

  return Math.max(MIN_STABILITY, Math.min(MAX_STABILITY, newStability));
}

/**
 * Update difficulty after a review
 * D' = clamp(D + ΔD, 1, 10)
 */
function updateDifficulty(
  currentDifficulty: number,
  rating: ReviewRating
): number {
  let delta = 0;

  switch (rating) {
    case 'again':
      delta = +DIFFICULTY_STEP * 2; // Significantly harder
      break;
    case 'hard':
      delta = +DIFFICULTY_STEP;
      break;
    case 'good':
      delta = -DIFFICULTY_STEP * 0.5; // Slightly easier over time
      break;
    case 'easy':
      delta = -DIFFICULTY_STEP * 1.5; // Much easier
      break;
  }

  return Math.max(1, Math.min(10, currentDifficulty + delta));
}

/**
 * Determine the next state (learning | review | mastered)
 */
function determineNextState(
  currentState: string,
  newStability: number,
  reps: number,
  lapses: number
): 'learning' | 'review' | 'mastered' {
  // Mastered: high stability (>60 days), multiple successful reviews, no recent lapses
  if (newStability >= 60 && reps >= 5 && lapses === 0) {
    return 'mastered';
  }

  // Review: stable enough to be reviewing (>7 days stability)
  if (newStability >= 7 && reps >= 2) {
    return 'review';
  }

  // Still learning
  return 'learning';
}

/**
 * Main FSRS Review Calculator
 * Given a node and a rating, compute the next state
 */
export function calculateNextReview(
  node: FSRSNode,
  rating: ReviewRating,
  _latencyMs: number = 0, // reserved: fast-correct vs slow-correct evidence
  now: Date = new Date()
): ReviewResult {
  const daysSinceLastReview =
    (now.getTime() - node.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate current retrievability
  const currentRetrievability = calculateRetrievability(
    daysSinceLastReview,
    node.stability
  );

  // Update stability and difficulty
  const nextStability = updateStability(
    node.stability,
    node.difficulty,
    currentRetrievability,
    rating
  );
  const nextDifficulty = updateDifficulty(node.difficulty, rating);

  // Calculate next interval and due date
  const nextInterval = calculateNextInterval(nextStability, TARGET_RETRIEVABILITY);
  const nextDueAt = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  // Retrievability resets to 1.0 immediately after review
  const nextRetrievability = 1.0;

  // Update reps and lapses
  const nextReps = rating === 'again' ? node.reps : node.reps + 1;
  const nextLapses = rating === 'again' ? node.lapses + 1 : node.lapses;

  // Determine next state
  const nextState = determineNextState(
    node.state,
    nextStability,
    nextReps,
    nextLapses
  );

  return {
    nextStability,
    nextDifficulty,
    nextRetrievability,
    nextDueAt,
    nextInterval,
    nextState,
  };
}

/**
 * Initialize a new knowledge node with default FSRS parameters
 */
export function initializeFSRSNode(
  userId: string,
  courseId: number,
  conceptId: string,
  conceptType: FSRSNode['conceptType'],
  initialDifficulty: number = 5.0
): Omit<FSRSNode, 'id'> {
  const now = new Date();
  return {
    userId,
    courseId,
    conceptId,
    conceptType,
    stability: 1.0, // Start with 1 day stability
    difficulty: initialDifficulty,
    retrievability: 1.0,
    lastReviewedAt: now,
    dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due tomorrow
    reps: 0,
    lapses: 0,
    state: 'learning',
  };
}

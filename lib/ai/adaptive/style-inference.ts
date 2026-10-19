/**
 * Learning-style inference.
 *
 * Declared style comes from onboarding (`user_preferences.learning_style`).
 * Inferred style is computed from evidence in `learner_sessions`: which
 * modalities the learner answers accurately *and* quickly.
 *
 *   effective = declared, until ≥ WARMUP_ATTEMPTS of style-relevant evidence
 *   then      = argmax over styles of (0.6·declaredMatch + 0.4·inferredScore)
 *
 * Sessions map to modalities via their recorded skill:
 *   vocabulary, script      → visual
 *   listening               → audio
 *   speaking                → speaking
 *   conversation            → conversational
 *   grammar                 → neutral (not style evidence)
 */

import { Skill } from './ability';

export type LearningStyle =
  | 'visual'
  | 'audio'
  | 'speaking'
  | 'conversational'
  | 'balanced';

export const LEARNING_STYLES: LearningStyle[] = [
  'visual',
  'audio',
  'speaking',
  'conversational',
  'balanced',
];

/** Minimum style-relevant attempts before inference can override declared. */
export const STYLE_WARMUP_ATTEMPTS = 15;

export interface SessionEvidence {
  skill?: string | null;
  isCorrect: boolean;
  latencyMs: number;
}

type ScoredStyle = Exclude<LearningStyle, 'balanced'>;

const SKILL_TO_STYLE: Partial<Record<Skill, ScoredStyle>> = {
  vocabulary: 'visual',
  script: 'visual',
  listening: 'audio',
  speaking: 'speaking',
  conversation: 'conversational',
};

export interface StyleProfile {
  declared: LearningStyle;
  inferred: ScoredStyle | null;
  effective: LearningStyle;
  /** Attempts used as evidence (post-filter). */
  evidence: number;
}

/**
 * Combine declared preference with behavioral evidence.
 * Pure function — pass session rows; no I/O.
 */
export function computeStyle(
  declaredRaw: string | null | undefined,
  sessions: SessionEvidence[]
): StyleProfile {
  const declared: LearningStyle = LEARNING_STYLES.includes(
    declaredRaw as LearningStyle
  )
    ? (declaredRaw as LearningStyle)
    : 'balanced';

  const relevant = sessions.filter(
    (s) => s.skill && s.skill in SKILL_TO_STYLE && s.isCorrect !== undefined
  );
  const inferred =
    relevant.length >= STYLE_WARMUP_ATTEMPTS ? inferStyle(relevant) : null;

  let effective: LearningStyle = declared;
  if (inferred && declared !== 'balanced') {
    // Blend: declared still weighs 60%; a clear inferred winner can override.
    const declaredScore = modalityScore(relevant, declared as ScoredStyle);
    const inferredScore = modalityScore(relevant, inferred);
    if (0.4 * inferredScore > 0.6 * declaredScore && inferred !== declared) {
      effective = inferred;
    }
  } else if (inferred && declared === 'balanced') {
    effective = inferred;
  }

  return { declared, inferred, effective, evidence: relevant.length };
}

/** Per-modality score: accuracy − normalized mean latency penalty, 0..1. */
export function modalityScore(
  sessions: SessionEvidence[],
  style: ScoredStyle
): number {
  const rows = sessions.filter((s) => SKILL_TO_STYLE[s.skill as Skill] === style);
  if (rows.length === 0) return 0.25; // weak prior — no evidence
  const acc = rows.filter((r) => r.isCorrect).length / rows.length;
  const meanLatency =
    rows.reduce((a, r) => a + Math.min(r.latencyMs, 30000), 0) / rows.length;
  const latencyScore = 1 - Math.min(meanLatency / 15000, 1); // 15s+ = 0
  return 0.7 * acc + 0.3 * latencyScore;
}

function inferStyle(sessions: SessionEvidence[]): ScoredStyle {
  const styles: ScoredStyle[] = ['visual', 'audio', 'speaking', 'conversational'];
  return styles.reduce((best, s) =>
    modalityScore(sessions, s) > modalityScore(sessions, best) ? s : best
  );
}

/**
 * Style → challenge-type affinity: which exercise formats serve this learner
 * best. Ordered by preference; composers rotate through the list.
 */
export const STYLE_TYPE_AFFINITY: Record<
  LearningStyle,
  Array<'SELECT' | 'ASSIST' | 'TRANSLATE' | 'MATCH' | 'ORDER' | 'SPEAK' | 'LISTEN' | 'CONVERSATION'>
> = {
  visual: ['SELECT', 'MATCH', 'TRANSLATE', 'ORDER'],
  audio: ['LISTEN', 'TRANSLATE', 'SELECT', 'ORDER'],
  speaking: ['SPEAK', 'LISTEN', 'ORDER', 'SELECT'],
  conversational: ['CONVERSATION', 'TRANSLATE', 'ASSIST', 'SELECT'],
  balanced: ['SELECT', 'TRANSLATE', 'ASSIST', 'ORDER', 'LISTEN'],
};

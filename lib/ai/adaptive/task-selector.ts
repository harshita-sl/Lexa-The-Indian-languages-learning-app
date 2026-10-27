/**
 * Next-best-task selector.
 *
 * Ranks candidate tasks across four signals and always emits a human-readable
 * reason (logged to recommendation_log for auditability):
 *   - dueUrgency      : FSRS retrievability decay (1 - R)
 *   - zpdReadiness    : prerequisite mastery fraction (i+1 frontier)
 *   - eloProximity    : item difficulty vs learner ability (~75% target)
 *   - remediationBoost: concept linked to a recent error dimension
 */

import { calculateRetrievability, FSRSNode } from './fsrs-scheduler';
import { getConceptById } from './knowledge-graph';
import { calculateZPD } from './zpd-calculator';
import { eloProximity, conceptTypeToSkill, Skill, SkillAbility } from './ability';
import { ErrorDimension } from '../indic/error-diagnoser';

export type TaskType = 'fsrs_review' | 'zpd_new' | 'remediation' | 'conversation';

export interface ScoredTask {
  type: TaskType;
  conceptId: string;
  label: string;
  skill: Skill;
  reason: string;
  scores: {
    dueUrgency: number;
    zpdReadiness: number;
    eloProximity: number;
    remediationBoost: number;
    total: number;
  };
}

const W = { due: 0.35, zpd: 0.25, elo: 0.25, remediation: 0.15 };

// Error dimension → concept tag hints for remediation targeting
const ERROR_TAG_HINTS: Record<Exclude<ErrorDimension, 'none'>, string[]> = {
  syntax: ['word_order', 'cases', 'verbs', 'negation'],
  l1_interference: ['word_order', 'cases', 'syntax'],
  phonetic: ['script', 'vowels', 'consonants'],
  pragmatic: ['honorific', 'pronouns', 'register'],
};

function conceptMatchesErrorDims(conceptId: string, dims: ErrorDimension[]): boolean {
  const concept = getConceptById(conceptId);
  if (!concept) return false;
  const hints = dims.flatMap(
    (d) => ERROR_TAG_HINTS[d as Exclude<ErrorDimension, 'none'>] ?? []
  );
  return concept.tags.some((t) => hints.includes(t)) ||
    hints.includes(concept.type);
}

export interface SelectTasksInput {
  language: string;
  nodes: FSRSNode[];
  skillStates?: Partial<Record<Skill, SkillAbility>>;
  recentErrorDims?: ErrorDimension[];
  count?: number;
  includeConversation?: boolean;
  /** Simulated clock for tests/simulator; defaults to real time. */
  now?: Date;
}

function skillElo(skill: Skill, states?: Partial<Record<Skill, SkillAbility>>): number {
  return states?.[skill]?.elo ?? 1000;
}

/** Difficulty proxy on the Elo scale for a concept (level 1-5 → beta). */
export function conceptBeta(level: number): number {
  return 1000 + (level - 3) * 150; // level 3 ≈ beta 1000
}

export function selectTasks(input: SelectTasksInput): ScoredTask[] {
  const {
    language,
    nodes,
    skillStates,
    recentErrorDims = [],
    count = 5,
    includeConversation = true,
  } = input;
  const now = input.now ?? new Date();
  const nodeMap = new Map(nodes.map((n) => [n.conceptId, n]));
  const tasks: ScoredTask[] = [];

  // 1. Due reviews — urgency = 1 - current retrievability
  for (const node of nodes) {
    const daysSince = (now.getTime() - node.lastReviewedAt.getTime()) / 86400000;
    const r = calculateRetrievability(daysSince, node.stability);
    const due = now >= node.dueAt || r < 0.88;
    if (!due) continue;
    const concept = getConceptById(node.conceptId);
    const skill = conceptTypeToSkill(node.conceptType);
    const urgency = 1 - r;
    const remBoost = conceptMatchesErrorDims(node.conceptId, recentErrorDims) ? 1 : 0;
    const eloP = eloProximity(skillElo(skill, skillStates), node.difficulty * 160);
    const total = W.due * urgency + W.elo * eloP + W.remediation * remBoost;
    tasks.push({
      type: 'fsrs_review',
      conceptId: node.conceptId,
      label: concept?.label ?? node.conceptId,
      skill,
      reason: r < 0.7
        ? `Overdue — memory at ${Math.round(r * 100)}%, relearn before it's gone`
        : `Due for review — memory at ${Math.round(r * 100)}%`,
      scores: {
        dueUrgency: r2(urgency),
        zpdReadiness: 0,
        eloProximity: r2(eloP),
        remediationBoost: remBoost,
        total: r2(total),
      },
    });
  }

  // 2. ZPD frontier — new concepts whose prerequisites are solid
  for (const cand of calculateZPD(language, nodes, now)) {
    const alreadyDue = nodeMap.has(cand.concept.id) &&
      (now >= (nodeMap.get(cand.concept.id)!).dueAt);
    if (alreadyDue) continue; // already covered by review branch
    const skill = conceptTypeToSkill(cand.concept.type);
    const beta = conceptBeta(cand.concept.level);
    const eloP = eloProximity(skillElo(skill, skillStates), beta);
    const remBoost = conceptMatchesErrorDims(cand.concept.id, recentErrorDims) ? 1 : 0;
    const total =
      W.zpd * cand.readinessScore + W.elo * eloP + W.remediation * remBoost;
    tasks.push({
      type: 'zpd_new',
      conceptId: cand.concept.id,
      label: cand.concept.label,
      skill,
      reason: cand.reason,
      scores: {
        dueUrgency: 0,
        zpdReadiness: r2(cand.readinessScore),
        eloProximity: r2(eloP),
        remediationBoost: remBoost,
        total: r2(total),
      },
    });
  }

  // 3. Remediation — recent recurring error dimensions with available concepts
  const dimCounts = new Map<ErrorDimension, number>();
  for (const d of recentErrorDims) {
    if (d !== 'none') dimCounts.set(d, (dimCounts.get(d) ?? 0) + 1);
  }
  for (const [dim, n] of dimCounts) {
    if (n < 2) continue; // needs recurrence, not a one-off
    const target = tasks.find((t) =>
      conceptMatchesErrorDims(t.conceptId, [dim])
    );
    if (target) {
      // bump existing candidate into remediation framing
      target.scores.remediationBoost = 1;
      target.scores.total = r2(target.scores.total + W.remediation);
      target.reason = `Weak area detected (${dim}) — targeted practice`;
      continue;
    }
    // find any concept matching the dim that's already in progress
    const struggling = nodes.find((node) =>
      conceptMatchesErrorDims(node.conceptId, [dim]) && node.state === 'learning'
    );
    if (struggling) {
      const skill = conceptTypeToSkill(struggling.conceptType);
      tasks.push({
        type: 'remediation',
        conceptId: struggling.conceptId,
        label: getConceptById(struggling.conceptId)?.label ?? struggling.conceptId,
        skill,
        reason: `Weak area detected (${dim}) — ${n} recent errors`,
        scores: { dueUrgency: 0, zpdReadiness: 0, eloProximity: 0.5, remediationBoost: 1, total: r2(W.remediation + W.elo * 0.5) },
      });
    }
  }

  tasks.sort((a, b) => b.scores.total - a.scores.total);
  const slots = Math.max(0, count - (includeConversation ? 1 : 0));

  // Guarantee due reviews a floor: up to half the slots are reserved for them
  // so fading memories are never starved out by shiny new concepts.
  const reviews = tasks.filter((t) => t.type === 'fsrs_review');
  const others = tasks.filter((t) => t.type !== 'fsrs_review');
  const reviewTake = Math.min(reviews.length, Math.ceil(slots / 2));
  const picked = [
    ...reviews.slice(0, reviewTake),
    ...others.slice(0, slots - reviewTake),
  ].sort((a, b) => b.scores.total - a.scores.total);

  // 4. Conversation challenge — always last slot when learner has any footing
  if (includeConversation && nodes.length > 0) {
    const convoElo = skillElo('conversation', skillStates);
    picked.push({
      type: 'conversation',
      conceptId: `${language.toLowerCase()}_conversation_practice`,
      label: 'Conversation challenge',
      skill: 'conversation',
      reason: convoElo >= 1000
        ? 'Apply what you know — open conversation practice'
        : 'Low-pressure speaking warm-up with your AI companion',
      scores: { dueUrgency: 0, zpdReadiness: 0, eloProximity: 0.5, remediationBoost: 0, total: 0.3 },
    });
  }

  return picked;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

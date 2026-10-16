/**
 * Zone of Proximal Development (ZPD) Calculator
 * Selects optimal next learning targets (i+1 concepts) based on prerequisite mastery:
 * - A concept is in the ZPD if >= 80% of its direct prerequisites have Retrievability R >= 0.75
 * - Filters out concepts that are already mastered (R >= 0.95 and high stability)
 * - Prioritizes concepts closest to the learner's current frontier
 */

import { ConceptNode, getLanguageGraph, getConceptById } from './knowledge-graph';
import { FSRSNode, calculateRetrievability } from './fsrs-scheduler';

export interface ZPDCandidate {
  concept: ConceptNode;
  readinessScore: number; // 0.0 - 1.0 (How ready the learner is based on prerequisites)
  prerequisiteStatus: Array<{
    prereqId: string;
    prereqLabel: string;
    retrievability: number;
    isReady: boolean;
  }>;
  priorityScore: number; // Combined score for ranking candidate concepts
  reason: string;
}

const MIN_PREREQUISITE_RETRIEVABILITY = 0.75;
const PREREQUISITE_COMPLETION_THRESHOLD = 0.80; // 80% of prerequisites must be ready

/**
 * Find all concepts in the Zone of Proximal Development for a learner
 */
export function calculateZPD(
  language: string,
  userNodes: FSRSNode[],
  now: Date = new Date()
): ZPDCandidate[] {
  const graph = getLanguageGraph(language);
  const nodeMap = new Map<string, FSRSNode>();

  // Build a lookup map of user's current knowledge nodes
  for (const node of userNodes) {
    const daysSince =
      (now.getTime() - node.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    const r = calculateRetrievability(daysSince, node.stability);
    nodeMap.set(node.conceptId, { ...node, retrievability: r });
  }

  const candidates: ZPDCandidate[] = [];

  for (const concept of graph) {
    const existingNode = nodeMap.get(concept.id);

    // If concept is already mastered (high stability and high retrievability), skip as new ZPD target
    if (existingNode && existingNode.state === 'mastered' && existingNode.retrievability >= 0.90) {
      continue;
    }

    // Evaluate prerequisites
    const prereqStatus: ZPDCandidate['prerequisiteStatus'] = [];
    let readyPrereqCount = 0;

    if (concept.prerequisites.length === 0) {
      // Level 1 foundational concept (no prerequisites)
      if (!existingNode || existingNode.state === 'learning') {
        candidates.push({
          concept,
          readinessScore: 1.0,
          prerequisiteStatus: [],
          priorityScore: 0.95 - (concept.level * 0.1),
          reason: 'Foundational concept ready to start',
        });
      }
      continue;
    }

    // Check each prerequisite
    for (const prereqId of concept.prerequisites) {
      const prereqConcept = getConceptById(prereqId);
      const prereqNode = nodeMap.get(prereqId);
      const r = prereqNode ? prereqNode.retrievability : 0;
      const isReady = r >= MIN_PREREQUISITE_RETRIEVABILITY;

      if (isReady) readyPrereqCount++;

      prereqStatus.push({
        prereqId,
        prereqLabel: prereqConcept?.label || prereqId,
        retrievability: Math.round(r * 100) / 100,
        isReady,
      });
    }

    const readinessFraction = readyPrereqCount / concept.prerequisites.length;

    // Check if readiness meets the 80% threshold
    if (readinessFraction >= PREREQUISITE_COMPLETION_THRESHOLD) {
      // Calculate priority
      // Higher priority for:
      // 1. Lower difficulty tiers (level 1-2 before level 4-5)
      // 2. High prerequisite readiness
      // 3. Concepts not yet started
      const levelFactor = 1.0 - (concept.level - 1) * 0.15;
      const notStartedBonus = !existingNode ? 0.2 : 0.0;
      const priorityScore = (readinessFraction * 0.5 + levelFactor * 0.3 + notStartedBonus);

      let reason = 'Prerequisites mastered; optimal next step';
      if (!existingNode) {
        reason = 'New concept unlocked in your learning frontier (i+1)';
      } else if (existingNode.state === 'learning') {
        reason = 'In progress — ready for deeper practice';
      }

      candidates.push({
        concept,
        readinessScore: readinessFraction,
        prerequisiteStatus: prereqStatus,
        priorityScore: Math.round(priorityScore * 100) / 100,
        reason,
      });
    }
  }

  // Sort candidates by priority score descending
  return candidates.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get the single top recommended next concept
 */
export function getTopZPDConcept(
  language: string,
  userNodes: FSRSNode[],
  now: Date = new Date()
): ZPDCandidate | null {
  const zpd = calculateZPD(language, userNodes, now);
  return zpd.length > 0 ? zpd[0] : null;
}

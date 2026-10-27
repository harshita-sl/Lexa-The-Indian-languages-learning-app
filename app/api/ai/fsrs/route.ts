import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  calculateNextReview,
  calculateRetrievability,
  initializeFSRSNode,
  FSRSNode,
  ReviewRating
} from '@/lib/ai/adaptive/fsrs-scheduler';
import {
  getLanguageGraph,
  calculateMasteryStatus,
  getConceptById
} from '@/lib/ai/adaptive/knowledge-graph';
import { calculateZPD } from '@/lib/ai/adaptive/zpd-calculator';
import db from '@/db/drizzle';
import { learnerKnowledgeNodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

type KnowledgeNodeRow = typeof learnerKnowledgeNodes.$inferSelect;

// GET: Fetch knowledge graph, retention decay heatmap, and ZPD candidates
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'telugu';
    const courseId = parseInt(searchParams.get('courseId') || '1');

    // 1. Fetch user knowledge nodes from DB
    let dbNodes: KnowledgeNodeRow[] = [];
    try {
      dbNodes = await db.query.learnerKnowledgeNodes.findMany({
        where: and(
          eq(learnerKnowledgeNodes.userId, effectiveUserId),
          eq(learnerKnowledgeNodes.courseId, courseId)
        ),
      });
    } catch (err) {
      console.warn('DB read error in FSRS GET, using memory simulation:', err);
    }

    // 2. Format into FSRSNode objects with up-to-date retrievability
    const now = new Date();
    const fsrsNodes: FSRSNode[] = dbNodes.map((n) => {
      const lastRev = n.lastReviewedAt ? new Date(n.lastReviewedAt) : now;
      const daysSince = (now.getTime() - lastRev.getTime()) / (1000 * 60 * 60 * 24);
      const r = calculateRetrievability(daysSince, n.stability || 1.0);

      return {
        id: n.id,
        userId: n.userId,
        courseId: n.courseId,
        conceptId: n.conceptId,
        conceptType: n.conceptType as FSRSNode['conceptType'],
        stability: n.stability || 1.0,
        difficulty: n.difficulty || 5.0,
        retrievability: r,
        lastReviewedAt: lastRev,
        dueAt: n.dueAt ? new Date(n.dueAt) : now,
        reps: n.reps || 0,
        lapses: n.lapses || 0,
        state: (n.state || 'learning') as FSRSNode['state'],
      };
    });

    // 3. If user has no nodes, seed with foundational concepts for demo
    const langGraph = getLanguageGraph(language);
    const populatedNodes = fsrsNodes.length > 0 ? fsrsNodes : seedDemoNodes(effectiveUserId, courseId, language);

    // 4. Calculate mastery snapshots & decay heatmap
    const masterySnapshots = populatedNodes.map((n) => {
      const snap = calculateMasteryStatus(n);
      const concept = getConceptById(n.conceptId);
      return {
        ...snap,
        label: concept?.label || n.conceptId,
        type: n.conceptType,
        level: concept?.level || 1,
        description: concept?.description || '',
      };
    });

    // 5. Calculate ZPD (i+1) candidates
    const zpdCandidates = calculateZPD(language, populatedNodes);

    // 6. Aggregate stats
    const totalConcepts = langGraph.length;
    const activeNodes = populatedNodes.length;
    const avgRetention = populatedNodes.length > 0
      ? Math.round((populatedNodes.reduce((acc, n) => acc + n.retrievability, 0) / populatedNodes.length) * 100)
      : 85;
    const dueReviewsCount = populatedNodes.filter(n => n.retrievability < 0.88 || now >= n.dueAt).length;
    const masteredCount = populatedNodes.filter(n => n.state === 'mastered').length;

    return NextResponse.json({
      language,
      totalConceptsInGraph: totalConcepts,
      activeNodesCount: activeNodes,
      avgRetentionRate: avgRetention,
      dueReviewsCount,
      masteredCount,
      nodes: masterySnapshots,
      zpdCandidates,
      taxonomyGraph: langGraph,
    });
  } catch (error) {
    console.error('FSRS GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch FSRS data' }, { status: 500 });
  }
}

// POST: Record a review interaction and update FSRS parameters
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const body = await request.json();
    const {
      conceptId,
      conceptType = 'vocabulary',
      rating, // 'again' | 'hard' | 'good' | 'easy'
      courseId = 1,
      latencyMs = 1200,
    } = body;

    if (!conceptId || !rating) {
      return NextResponse.json({ error: 'Missing conceptId or rating' }, { status: 400 });
    }

    // 1. Fetch existing node from DB
    let existingNode: KnowledgeNodeRow | undefined;
    try {
      existingNode = await db.query.learnerKnowledgeNodes.findFirst({
        where: and(
          eq(learnerKnowledgeNodes.userId, effectiveUserId),
          eq(learnerKnowledgeNodes.conceptId, conceptId)
        ),
      });
    } catch (e) {
      console.warn('DB lookup failed in FSRS POST:', e);
    }

    const now = new Date();
    let currentFSRSNode: FSRSNode;

    if (existingNode) {
      currentFSRSNode = {
        id: existingNode.id,
        userId: existingNode.userId,
        courseId: existingNode.courseId,
        conceptId: existingNode.conceptId,
        conceptType: existingNode.conceptType as FSRSNode['conceptType'],
        stability: existingNode.stability,
        difficulty: existingNode.difficulty,
        retrievability: existingNode.retrievability,
        lastReviewedAt: existingNode.lastReviewedAt ? new Date(existingNode.lastReviewedAt) : now,
        dueAt: existingNode.dueAt ? new Date(existingNode.dueAt) : now,
        reps: existingNode.reps,
        lapses: existingNode.lapses,
        state: (existingNode.state || 'learning') as FSRSNode['state'],
      };
    } else {
      const init = initializeFSRSNode(effectiveUserId, courseId, conceptId, conceptType);
      currentFSRSNode = { ...init, lastReviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    }

    // 2. Compute FSRS next state
    const updateResult = calculateNextReview(currentFSRSNode, rating as ReviewRating, latencyMs);

    // 3. Persist to DB
    try {
      if (existingNode) {
        await db.update(learnerKnowledgeNodes).set({
          stability: updateResult.nextStability,
          difficulty: updateResult.nextDifficulty,
          retrievability: updateResult.nextRetrievability,
          lastReviewedAt: now,
          dueAt: updateResult.nextDueAt,
          reps: rating === 'again' ? currentFSRSNode.reps : currentFSRSNode.reps + 1,
          lapses: rating === 'again' ? currentFSRSNode.lapses + 1 : currentFSRSNode.lapses,
          state: updateResult.nextState,
        }).where(eq(learnerKnowledgeNodes.id, existingNode.id));
      } else {
        await db.insert(learnerKnowledgeNodes).values({
          userId: effectiveUserId,
          courseId,
          conceptId,
          conceptType,
          stability: updateResult.nextStability,
          difficulty: updateResult.nextDifficulty,
          retrievability: updateResult.nextRetrievability,
          lastReviewedAt: now,
          dueAt: updateResult.nextDueAt,
          reps: rating === 'again' ? 0 : 1,
          lapses: rating === 'again' ? 1 : 0,
          state: updateResult.nextState,
        });
      }
    } catch (dbErr) {
      console.warn('Could not persist FSRS node update to DB, returning computed values:', dbErr);
    }

    return NextResponse.json({
      success: true,
      conceptId,
      rating,
      nextStability: Math.round(updateResult.nextStability * 10) / 10,
      nextDifficulty: Math.round(updateResult.nextDifficulty * 10) / 10,
      nextIntervalDays: updateResult.nextInterval,
      nextDueAt: updateResult.nextDueAt,
      nextState: updateResult.nextState,
    });
  } catch (error) {
    console.error('FSRS POST Error:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}

// Helper to provide realistic demo nodes for new users
function seedDemoNodes(userId: string, courseId: number, language: string): FSRSNode[] {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  if (language === 'telugu') {
    return [
      {
        userId,
        courseId,
        conceptId: 'telugu_script_vowels_short',
        conceptType: 'script',
        stability: 14.5,
        difficulty: 3.2,
        retrievability: 0.94,
        lastReviewedAt: new Date(now.getTime() - 1 * day),
        dueAt: new Date(now.getTime() + 13 * day),
        reps: 6,
        lapses: 0,
        state: 'mastered',
      },
      {
        userId,
        courseId,
        conceptId: 'telugu_script_vowels_long',
        conceptType: 'script',
        stability: 8.2,
        difficulty: 4.0,
        retrievability: 0.89,
        lastReviewedAt: new Date(now.getTime() - 2 * day),
        dueAt: new Date(now.getTime() + 6 * day),
        reps: 4,
        lapses: 0,
        state: 'review',
      },
      {
        userId,
        courseId,
        conceptId: 'telugu_script_consonants_kvarga',
        conceptType: 'script',
        stability: 5.1,
        difficulty: 5.5,
        retrievability: 0.82,
        lastReviewedAt: new Date(now.getTime() - 3 * day),
        dueAt: new Date(now.getTime() - 1 * day), // Overdue
        reps: 3,
        lapses: 1,
        state: 'review',
      },
      {
        userId,
        courseId,
        conceptId: 'telugu_vocab_greetings',
        conceptType: 'vocabulary',
        stability: 18.0,
        difficulty: 2.5,
        retrievability: 0.96,
        lastReviewedAt: new Date(now.getTime() - 1 * day),
        dueAt: new Date(now.getTime() + 17 * day),
        reps: 8,
        lapses: 0,
        state: 'mastered',
      },
      {
        userId,
        courseId,
        conceptId: 'telugu_vocab_numbers_1_10',
        conceptType: 'vocabulary',
        stability: 3.0,
        difficulty: 6.0,
        retrievability: 0.72,
        lastReviewedAt: new Date(now.getTime() - 4 * day),
        dueAt: new Date(now.getTime() - 1 * day), // Due
        reps: 2,
        lapses: 1,
        state: 'learning',
      },
      {
        userId,
        courseId,
        conceptId: 'telugu_pronouns_basic',
        conceptType: 'grammar_rule',
        stability: 2.2,
        difficulty: 5.0,
        retrievability: 0.85,
        lastReviewedAt: new Date(now.getTime() - 1 * day),
        dueAt: new Date(now.getTime() + 1 * day),
        reps: 2,
        lapses: 0,
        state: 'learning',
      },
    ];
  }

  return [
    {
      userId,
      courseId,
      conceptId: `${language}_script_vowels`,
      conceptType: 'script',
      stability: 12.0,
      difficulty: 3.5,
      retrievability: 0.92,
      lastReviewedAt: new Date(now.getTime() - 2 * day),
      dueAt: new Date(now.getTime() + 10 * day),
      reps: 5,
      lapses: 0,
      state: 'mastered',
    },
    {
      userId,
      courseId,
      conceptId: `${language}_vocab_greetings`,
      conceptType: 'vocabulary',
      stability: 15.0,
      difficulty: 2.8,
      retrievability: 0.95,
      lastReviewedAt: new Date(now.getTime() - 1 * day),
      dueAt: new Date(now.getTime() + 14 * day),
      reps: 6,
      lapses: 0,
      state: 'mastered',
    },
  ];
}

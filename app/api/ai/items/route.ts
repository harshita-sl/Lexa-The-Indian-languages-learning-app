import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { practiceItems, learnerSkillState } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateChallenge } from '@/lib/ai/challenge-generator';
import { getConceptById } from '@/lib/ai/adaptive/knowledge-graph';
import { conceptTypeToSkill, targetItemBeta } from '@/lib/ai/adaptive/ability';
import { createHash } from 'crypto';

/**
 * GET /api/ai/items?conceptId=&language=&courseId=
 * Serves one practice item for a concept: prefers the bank item whose Elo
 * beta best matches the learner's skill rating; falls back to on-demand
 * LLM generation (cached + marked unreviewed).
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get('conceptId');
    const language = (searchParams.get('language') || 'telugu').toLowerCase();
    const courseId = parseInt(searchParams.get('courseId') || '1', 10);
    if (!conceptId) {
      return NextResponse.json({ error: 'conceptId required' }, { status: 400 });
    }

    const concept = getConceptById(conceptId);
    const skill = concept ? conceptTypeToSkill(concept.type) : 'vocabulary';

    // Learner's ability for this skill → target difficulty
    const skillRow = await db.query.learnerSkillState
      .findFirst({
        where: and(
          eq(learnerSkillState.userId, effectiveUserId),
          eq(learnerSkillState.courseId, courseId),
          eq(learnerSkillState.skill, skill)
        ),
      })
      .catch(() => undefined);
    const targetBeta = targetItemBeta(skillRow?.elo ?? 1000);

    // Best-matching bank item
    const bank = await db.query.practiceItems
      .findMany({
        where: and(
          eq(practiceItems.language, language),
          eq(practiceItems.conceptId, conceptId)
        ),
      })
      .catch(() => []);

    if (bank.length > 0) {
      // Rotate among the 3 closest difficulty matches — revisits see variety
      // instead of the same best-fit item every time.
      const ranked = [...bank].sort(
        (a, b) => Math.abs(a.difficultyB - targetBeta) - Math.abs(b.difficultyB - targetBeta)
      );
      const best = ranked[Math.floor(Math.random() * Math.min(3, ranked.length))];
      return NextResponse.json({
        source: 'bank',
        reviewStatus: best.reviewStatus,
        item: {
          id: best.id,
          conceptId,
          skill,
          type: best.type,
          difficultyB: best.difficultyB,
          ...(best.payload as object),
        },
      });
    }

    // LLM fallback — generate, tag, store as unreviewed
    const generated = await generateChallenge({
      language,
      challengeType: 'SELECT',
      topic: concept?.label ?? conceptId,
      difficulty: 'beginner',
      userLevel: 'beginner',
      conceptId,
      context: `concept:${conceptId}`,
    });

    const contentHash = createHash('sha256')
      .update(`${language}:${conceptId}:${generated.question}`)
      .digest('hex')
      .slice(0, 32);
    await db
      .insert(practiceItems)
      .values({
        language,
        conceptId,
        skill,
        type: generated.type ?? 'SELECT',
        payload: generated,
        difficultyB: targetBeta,
        reviewStatus: 'unreviewed',
        source: 'llm',
        contentHash,
      })
      .onConflictDoNothing()
      .catch(() => {});

    return NextResponse.json({
      source: 'llm',
      reviewStatus: 'unreviewed',
      item: {
        ...generated,
        id: `llm_${contentHash}`,
        conceptId,
        skill,
        type: generated.type ?? 'SELECT',
        difficultyB: targetBeta,
      },
    });
  } catch (error) {
    console.error('Items GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

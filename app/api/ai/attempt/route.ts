import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { attemptSchema } from '@/lib/validators';
import {
  recordAttempt,
  drizzleLearnerRepo,
} from '@/lib/ai/adaptive/learner-model';
import { getConceptById } from '@/lib/ai/adaptive/knowledge-graph';
import { conceptTypeToSkill } from '@/lib/ai/adaptive/ability';

/**
 * POST /api/ai/attempt — the single write path into the learner model.
 * Every surface (lesson, practice, placement, chat) records attempts here.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';

    const parsed = attemptSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid attempt payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Surfaces may omit skill — derive it from the concept's type.
    const concept = getConceptById(body.conceptId);
    const skill = body.skill ?? (concept ? conceptTypeToSkill(concept.type) : 'vocabulary');
    const conceptType = body.conceptType ?? concept?.type;

    const result = await recordAttempt(
      {
        userId: effectiveUserId,
        courseId: body.courseId,
        conceptId: body.conceptId,
        conceptType,
        itemKey: body.itemKey,
        itemType: body.itemType,
        skill,
        correct: body.correct,
        userAnswer: body.userAnswer,
        expectedAnswer: body.expectedAnswer,
        challengeId: body.challengeId,
        latencyMs: body.latencyMs,
        hintsUsed: body.hintsUsed,
        source: body.source,
        taskReason: body.taskReason,
        language: body.language,
        targetRegister: body.targetRegister,
        pronunciationScore: body.pronunciationScore,
      },
      drizzleLearnerRepo()
    );

    return NextResponse.json({
      success: true,
      rating: result.rating,
      diagnosis: result.diagnosis,
      concept: {
        stability: Math.round(result.concept.stability * 10) / 10,
        dueAt: result.concept.dueAt,
        state: result.concept.state,
      },
      skill: result.skill,
    });
  } catch (error) {
    console.error('Attempt POST error:', error);
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 });
  }
}

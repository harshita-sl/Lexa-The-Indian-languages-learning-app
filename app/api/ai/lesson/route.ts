import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  composeLesson,
  drizzleComposerRepo,
} from '@/lib/ai/adaptive/lesson-composer';
import { getConceptById } from '@/lib/ai/adaptive/knowledge-graph';

/**
 * GET /api/ai/lesson?conceptId=&language=&courseId=
 * Returns a style- & pace-adapted lesson: item types match the learner's
 * effective style, length/difficulty ramp match their pace tier.
 * Every response carries `reasons` for explainability.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get('conceptId');
    const language = (searchParams.get('language') || 'Telugu');
    const courseId = parseInt(searchParams.get('courseId') || '1', 10);
    const userLevel = searchParams.get('level') || 'beginner';

    if (!conceptId || !getConceptById(conceptId)) {
      return NextResponse.json(
        { error: 'Unknown or missing conceptId' },
        { status: 400 }
      );
    }

    const lesson = await composeLesson(
      { userId: effectiveUserId, courseId, conceptId, language, userLevel },
      drizzleComposerRepo()
    );

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson compose error:', error);
    return NextResponse.json({ error: 'Failed to compose lesson' }, { status: 500 });
  }
}

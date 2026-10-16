import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { buildDailyPlan, drizzlePlanRepo } from '@/lib/ai/adaptive/daily-plan';

/**
 * GET /api/ai/daily-plan?courseId=1 — today's personalized plan.
 * Each step carries a reason; steps are logged to recommendation_log.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const { searchParams } = new URL(request.url);
    const courseId = parseInt(searchParams.get('courseId') || '1', 10);

    const plan = await buildDailyPlan(effectiveUserId, courseId, drizzlePlanRepo());
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Daily plan error:', error);
    return NextResponse.json({ error: 'Failed to build daily plan' }, { status: 500 });
  }
}

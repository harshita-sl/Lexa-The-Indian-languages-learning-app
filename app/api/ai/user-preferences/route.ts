import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { prefsSchema } from '@/lib/validators';

const defaultPrefs = {
  learningStyle: 'balanced' as const,
  difficulty: 'adaptive' as const,
  dailyGoalMinutes: 15,
  preferredTopics: [] as string[],
  nativeLanguage: 'English',
  targetLanguage: null as string | null,
  goal: 'culture' as const,
  currentLevel: 'beginner' as const,
  targetRegister: 'colloquial' as const,
  transliterationMode: 'both' as const,
  assessmentCompleted: false,
  onboardingCompleted: false,
};

export async function GET() {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    try {
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
      });

      if (!prefs) {
        return NextResponse.json(defaultPrefs);
      }

      return NextResponse.json(prefs);
    } catch {
      return NextResponse.json(defaultPrefs);
    }
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    const parsed = prefsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid preferences', issues: parsed.error.issues }, { status: 400 });
    }
    const p = parsed.data;

    const row = {
      learningStyle: p.learningStyle ?? 'balanced',
      difficulty: p.difficulty ?? 'adaptive',
      dailyGoalMinutes: p.dailyGoalMinutes ?? 15,
      preferredTopics: p.preferredTopics ?? [],
      nativeLanguage: p.nativeLanguage ?? 'English',
      targetLanguage: p.targetLanguage ?? null,
      goal: p.goal ?? 'culture',
      currentLevel: p.currentLevel ?? 'beginner',
      targetRegister: p.targetRegister ?? 'colloquial',
      transliterationMode: p.transliterationMode ?? 'both',
      assessmentCompleted: p.assessmentCompleted ?? false,
      onboardingCompleted: p.onboardingCompleted ?? false,
      updatedAt: new Date(),
    };

    try {
      await db.insert(userPreferences).values({ userId, ...row }).onConflictDoUpdate({
        target: userPreferences.userId,
        set: row,
      });
    } catch {
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
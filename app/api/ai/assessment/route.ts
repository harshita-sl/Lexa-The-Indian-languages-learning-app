import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateAssessmentQuestions, evaluateAssessment } from '@/lib/ai';

export async function GET(request: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'Hindi';

    const questions = await generateAssessmentQuestions(language);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Assessment generation error:', error);
    return NextResponse.json({ error: 'Failed to generate assessment' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    const body = await request.json();
    const { language, answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    const result = await evaluateAssessment(language, answers);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Assessment evaluation error:', error);
    return NextResponse.json({ error: 'Failed to evaluate assessment' }, { status: 500 });
  }
}
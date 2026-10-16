import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateTutorResponse, generateConversationStarter, generateExplanation } from '@/lib/ai';
import db from '@/db/drizzle';
import { conversations } from '@/db/schema';

export async function POST(request: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    const body = await request.json();
    const { 
      language, 
      userLevel, 
      topic, 
      message, 
      conversationHistory = [],
      action = 'chat' 
    } = body;

    if (!language || !userLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let response: string;

    switch (action) {
      case 'starter':
        response = await generateConversationStarter(language, userLevel, topic || 'general');
        break;
      case 'explain':
        response = await generateExplanation(language, topic || '', userLevel);
        break;
      case 'chat':
      default:
        if (!message) {
          return NextResponse.json({ error: 'Message required for chat' }, { status: 400 });
        }
        response = await generateTutorResponse(
          language,
          userLevel,
          topic || 'general',
          conversationHistory,
          message
        );
        break;
    }

    try {
      await db.insert(conversations).values({
        userId,
        language,
        messages: [
          ...conversationHistory,
          { role: 'user', content: message || '', timestamp: new Date().toISOString() },
          { role: 'assistant', content: response, timestamp: new Date().toISOString() },
        ],
        context: topic || 'general',
      });
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError);
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Tutor chat error:', error);
    return NextResponse.json({ error: 'Failed to get tutor response' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'Hindi';
    const userLevel = searchParams.get('level') || 'beginner';
    const topic = searchParams.get('topic') || 'greetings';

    const starter = await generateConversationStarter(language, userLevel, topic);
    
    return NextResponse.json({ starter });
  } catch (error) {
    console.error('Conversation starter error:', error);
    return NextResponse.json({ error: 'Failed to generate starter' }, { status: 500 });
  }
}
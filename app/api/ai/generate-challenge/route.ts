import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateChallenge, generateMultipleChallenges, getChallengeTypesForLevel } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = 'guest_demo_user';
    }

    const body = await request.json();
    const {
      language,
      topic,
      difficulty,
      challengeType,
      vocabulary,
      context,
      userLevel,
      conceptId,
      count = 1
    } = body;

    if (!language || !topic || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const types = challengeType 
      ? [challengeType] 
      : getChallengeTypesForLevel(userLevel || difficulty);

    let challenges;
    if (count > 1) {
      challenges = await generateMultipleChallenges({
        language,
        topic,
        difficulty,
        challengeType: types[0],
        vocabulary,
        context,
        userLevel,
        conceptId,
      }, count);
    } else {
      const challenge = await generateChallenge({
        language,
        topic,
        difficulty,
        challengeType: types[0],
        vocabulary,
        context,
        userLevel,
        conceptId,
      });
      challenges = [challenge];
    }

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}
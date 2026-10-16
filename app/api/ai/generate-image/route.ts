import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateImageForWord, generateImagesForChallenge } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { word, language, style, options } = body;

    if (options && Array.isArray(options)) {
      const urls = await generateImagesForChallenge(options, language || 'Hindi');
      return NextResponse.json({ urls });
    }

    if (!word || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const url = await generateImageForWord(word, language, { style: style || 'illustration' });
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { gnaniTTS, gnaniConfigured } from '@/lib/ai/speech/gnani';

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  language: z.string().min(2).max(40),
});

const buckets = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQ = 60;
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_REQ) return true;
  arr.push(now);
  buckets.set(userId, arr);
  return false;
}

/**
 * POST /api/ai/speech/tts — text → audio via the configured provider.
 * 503 when the provider isn't configured/fails → clients fall back to
 * browser Web Speech (speechSynthesis).
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    if (rateLimited(effectiveUserId)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    if (process.env.SPEECH_TTS_PROVIDER !== 'gnani' || !gnaniConfigured()) {
      return NextResponse.json({ error: 'TTS provider not configured' }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { audio, contentType } = await gnaniTTS(parsed.data.text, parsed.data.language);
    return new Response(audio, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
  }
}

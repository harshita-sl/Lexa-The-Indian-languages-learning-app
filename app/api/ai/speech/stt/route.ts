import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { gnaniSTT, gnaniConfigured } from '@/lib/ai/speech/gnani';

const MAX_AUDIO_BYTES = 3 * 1024 * 1024; // ~30s of 16kHz WAV — plenty
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
 * POST /api/ai/speech/stt — audio → transcript via the configured provider.
 * Accepts multipart/form-data (audio_file + language) or raw audio body
 * with ?language=. 503 when unconfigured/fails → clients fall back to
 * browser SpeechRecognition.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    if (rateLimited(effectiveUserId)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    if (process.env.SPEECH_STT_PROVIDER !== 'gnani' || !gnaniConfigured()) {
      return NextResponse.json({ error: 'STT provider not configured' }, { status: 503 });
    }

    const url = new URL(request.url);
    let audio: Buffer;
    let language = url.searchParams.get('language') ?? 'Telugu';
    let filename = 'speech.wav';
    let contentType = 'audio/wav';

    const ctype = request.headers.get('content-type') ?? '';
    if (ctype.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('audio_file');
      const lang = form.get('language');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'audio_file required' }, { status: 400 });
      }
      if (typeof lang === 'string' && lang) language = lang;
      filename = file.name || filename;
      contentType = file.type || contentType;
      audio = Buffer.from(await file.arrayBuffer());
    } else {
      audio = Buffer.from(await request.arrayBuffer());
      contentType = ctype || contentType;
    }

    if (audio.length === 0 || audio.length > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio empty or too large' }, { status: 400 });
    }

    const { transcript, requestId } = await gnaniSTT(audio, language, filename, contentType);
    return NextResponse.json({ transcript, requestId });
  } catch (error) {
    console.error('STT route error:', error);
    return NextResponse.json({ error: 'STT unavailable' }, { status: 503 });
  }
}

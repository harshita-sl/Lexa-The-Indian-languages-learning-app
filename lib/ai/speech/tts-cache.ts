/**
 * DB cache for synthesized speech — TTS calls are slow and metered, so a
 * repeated Listen click on the same text must replay bytes, not re-bill.
 *
 * Storage: tts_audio_cache table (Neon in prod, PGlite in local dev — either
 * way it survives restarts and serverless deploys, unlike a disk cache).
 * Key covers text + language + voice + model so a config change invalidates
 * naturally. Audio stored base64; content-type is sniffed on read when the
 * stored value is missing. Oldest entries evicted past MAX_ENTRIES.
 */

import { createHash } from 'crypto';
import db from '@/db/drizzle';
import { ttsAudioCache } from '@/db/schema';
import { eq, inArray, asc } from 'drizzle-orm';

const MAX_ENTRIES = 2000;

function keyFor(text: string, language: string): string {
  const h = createHash('sha256');
  h.update(JSON.stringify({
    t: text,
    l: language,
    v: process.env.GNANI_TTS_VOICE ?? 'Lakshmi',
    m: process.env.GNANI_TTS_MODEL ?? 'timbre-v3.0',
  }));
  return h.digest('hex').slice(0, 32);
}

function sniffContentType(buf: Buffer): string {
  if (buf.length > 3 && buf.toString('ascii', 0, 4) === 'RIFF') return 'audio/wav';
  if (buf.length > 3 && buf.toString('ascii', 0, 4) === 'OggS') return 'audio/ogg';
  if (buf.length > 2 && (buf.toString('ascii', 0, 3) === 'ID3' || buf[0] === 0xff)) return 'audio/mpeg';
  return 'application/octet-stream';
}

export interface CachedAudio {
  audio: Buffer;
  contentType: string;
}

export async function getCachedAudio(
  text: string,
  language: string
): Promise<CachedAudio | null> {
  try {
    const row = await db.query.ttsAudioCache.findFirst({
      where: eq(ttsAudioCache.keyHash, keyFor(text, language)),
    });
    if (!row) return null;
    const audio = Buffer.from(row.audioB64, 'base64');
    return { audio, contentType: row.contentType || sniffContentType(audio) };
  } catch {
    return null;
  }
}

export async function setCachedAudio(
  text: string,
  language: string,
  audio: ArrayBuffer,
  contentType?: string
): Promise<void> {
  try {
    const buf = Buffer.from(audio);
    if (!buf.length) return;
    await db
      .insert(ttsAudioCache)
      .values({
        keyHash: keyFor(text, language),
        language,
        contentType: contentType || sniffContentType(buf),
        audioB64: buf.toString('base64'),
      })
      .onConflictDoNothing({ target: ttsAudioCache.keyHash });
    void evictOldest();
  } catch {
    // cache write is best-effort — never block the response
  }
}

async function evictOldest(): Promise<void> {
  try {
    const rows = await db
      .select({ id: ttsAudioCache.id })
      .from(ttsAudioCache)
      .orderBy(asc(ttsAudioCache.createdAt));
    if (rows.length <= MAX_ENTRIES) return;
    const stale = rows.slice(0, rows.length - MAX_ENTRIES).map((r) => r.id);
    await db.delete(ttsAudioCache).where(inArray(ttsAudioCache.id, stale));
  } catch {}
}

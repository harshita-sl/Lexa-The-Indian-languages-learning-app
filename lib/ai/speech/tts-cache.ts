/**
 * Disk cache for synthesized speech — TTS calls are slow and metered, so a
 * repeated Listen click on the same text must replay bytes, not re-bill.
 *
 * Layout: .local/tts-cache/<sha256>.bin — key covers text + language + voice
 * + model so a config change invalidates naturally. Content-type is sniffed
 * from magic bytes on read. Oldest entries evicted past MAX_ENTRIES.
 */

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile, readdir, stat, unlink } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.local', 'tts-cache');
const MAX_ENTRIES = 400;

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
    const buf = await readFile(path.join(CACHE_DIR, `${keyFor(text, language)}.bin`));
    return { audio: buf, contentType: sniffContentType(buf) };
  } catch {
    return null;
  }
}

export async function setCachedAudio(
  text: string,
  language: string,
  audio: ArrayBuffer
): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(
      path.join(CACHE_DIR, `${keyFor(text, language)}.bin`),
      Buffer.from(audio)
    );
    void evictOldest();
  } catch {
    // cache write is best-effort — never block the response
  }
}

async function evictOldest(): Promise<void> {
  try {
    const files = await readdir(CACHE_DIR);
    if (files.length <= MAX_ENTRIES) return;
    const aged = await Promise.all(
      files.map(async (f) => ({
        f,
        mtime: (await stat(path.join(CACHE_DIR, f))).mtimeMs,
      }))
    );
    aged.sort((a, b) => a.mtime - b.mtime);
    for (const { f } of aged.slice(0, files.length - MAX_ENTRIES)) {
      await unlink(path.join(CACHE_DIR, f)).catch(() => {});
    }
  } catch {}
}

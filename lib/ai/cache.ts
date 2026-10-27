import db from '@/db/drizzle';
import { aiGeneratedContent } from '@/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { createHash } from 'crypto';

const memoryCache = new Map<string, { content: unknown; expiresAt: Date }>();

export function generateInputHash(input: Record<string, unknown>): string {
  const sorted = JSON.stringify(input, Object.keys(input).sort());
  return createHash('sha256').update(sorted).digest('hex').slice(0, 32);
}

function getMemoryCacheKey(contentType: string, inputHash: string): string {
  return `${contentType}:${inputHash}`;
}

function isExpired(expiresAt: Date): boolean {
  return new Date(expiresAt) < new Date();
}

export async function getCachedContent(
  contentType: string,
  inputHash: string
): Promise<unknown | null> {
  const memoryKey = getMemoryCacheKey(contentType, inputHash);
  const memoryEntry = memoryCache.get(memoryKey);
  
  if (memoryEntry && !isExpired(memoryEntry.expiresAt)) {
    return memoryEntry.content;
  }
  
  if (memoryEntry && isExpired(memoryEntry.expiresAt)) {
    memoryCache.delete(memoryKey);
  }

  try {
    const result = await db.query.aiGeneratedContent.findFirst({
      where: and(
        eq(aiGeneratedContent.contentType, contentType),
        eq(aiGeneratedContent.inputHash, inputHash)
      ),
    });

    if (result && result.expiresAt && new Date(result.expiresAt) < new Date()) {
      return null;
    }

    return result?.content || null;
  } catch {
    return null;
  }
}

export async function setCachedContent(
  contentType: string,
  inputHash: string,
  content: unknown,
  language: string,
  topic?: string,
  difficulty?: string,
  ttlDays: number = 30
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);
  
  const memoryKey = getMemoryCacheKey(contentType, inputHash);
  memoryCache.set(memoryKey, { content, expiresAt });

  try {
    await db.insert(aiGeneratedContent).values({
      contentType,
      inputHash,
      content: content as never,
      language,
      topic: topic || null,
      difficulty: difficulty || null,
      expiresAt,
    }).onConflictDoUpdate({
      target: [aiGeneratedContent.contentType, aiGeneratedContent.inputHash],
      set: {
        content: content as never,
        expiresAt,
        },
    });
  } catch {
  }
}

export async function clearExpiredCache(): Promise<void> {
  for (const [key, entry] of memoryCache.entries()) {
    if (isExpired(entry.expiresAt)) {
      memoryCache.delete(key);
    }
  }
  
  try {
    await db.delete(aiGeneratedContent)
      .where(and(isNotNull(aiGeneratedContent.expiresAt), lt(aiGeneratedContent.expiresAt, new Date())));
  } catch {
  }
}
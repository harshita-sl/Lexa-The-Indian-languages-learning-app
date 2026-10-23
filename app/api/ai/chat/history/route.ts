import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { conversations } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

interface StoredMsg {
  role: string;
  content: string;
  english?: string;
}

/**
 * GET /api/ai/chat/history?language=&limit=&id=
 * - `id` given → full transcript of one conversation
 * - else → newest-first summaries (id, scenario, when, turn count, preview)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const language = searchParams.get('language');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50);

    if (id) {
      const row = await db.query.conversations
        .findFirst({
          where: and(
            eq(conversations.id, parseInt(id, 10)),
            eq(conversations.userId, effectiveUserId)
          ),
        })
        .catch(() => undefined);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({
        id: row.id,
        language: row.language,
        scenario: row.context,
        updatedAt: row.updatedAt,
        messages: row.messages,
      });
    }

    const rows = await db.query.conversations
      .findMany({
        where: and(
          eq(conversations.userId, effectiveUserId),
          language ? eq(conversations.language, language) : undefined
        ),
        orderBy: [desc(conversations.updatedAt)],
        limit,
      })
      .catch(() => []);

    const items = rows.map((r) => {
      const msgs = (r.messages as StoredMsg[]) ?? [];
      const first = msgs.find((m) => m.role === 'assistant');
      return {
        id: r.id,
        language: r.language,
        scenario: r.context ?? 'free',
        updatedAt: r.updatedAt,
        turns: Math.floor(msgs.length / 2),
        preview: (first?.content ?? '').slice(0, 80),
        previewEnglish: (first?.english ?? '').slice(0, 80),
      };
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Chat history GET error:', error);
    return NextResponse.json({ items: [] });
  }
}

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  initPlacementState,
  recordPlacementAnswer,
  nextPlacementItem,
  placementDone,
  finalizePlacement,
  PlacementItem,
} from '@/lib/ai/adaptive/placement';
import { initializeFSRSNode } from '@/lib/ai/adaptive/fsrs-scheduler';
import { bktPriorForLevel } from '@/lib/ai/adaptive/bkt';
import db from '@/db/drizzle';
import {
  practiceItems,
  learnerKnowledgeNodes,
  learnerSkillState,
  userPreferences,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SKILL_KEYS, Skill } from '@/lib/ai/adaptive/ability';

const answerSchema = z.object({
  itemId: z.number().int(),
  conceptId: z.string().max(120),
  skill: z.enum(['vocabulary', 'script', 'listening', 'speaking', 'grammar', 'conversation']),
  difficultyB: z.number(),
  correct: z.boolean(),
});

const postSchema = z.object({
  language: z.string().min(2).max(40),
  courseId: z.number().int().positive().default(1),
  selfLevel: z.string().default('beginner'),
  answers: z.array(answerSchema).default([]),
});

// Built-in placement pool — guarantees the test works even before seeding.
const PLACEMENT_POOL: Record<string, (PlacementItem & { question: string; options: string[]; answer: string })[]> = {
  telugu: [
    { id: 101, conceptId: 'telugu_vocab_greetings', skill: 'vocabulary', difficultyB: 750, question: 'What does "నమస్కారం" (Namaskaram) mean?', options: ['Hello/Greetings', 'Goodbye', 'Thank you', 'Sorry'], answer: 'Hello/Greetings' },
    { id: 102, conceptId: 'telugu_vocab_numbers_1_10', skill: 'vocabulary', difficultyB: 800, question: '"ఐదు" (Ayidu) is which number?', options: ['Three', 'Five', 'Seven', 'Ten'], answer: 'Five' },
    { id: 103, conceptId: 'telugu_pronouns_basic', skill: 'grammar', difficultyB: 950, question: '"నేను" (Nenu) means?', options: ['You', 'I', 'He', 'We'], answer: 'I' },
    { id: 104, conceptId: 'telugu_verb_present_aa', skill: 'grammar', difficultyB: 1050, question: '"నేను తింటున్నాను" means?', options: ['I ate', 'I am eating', 'I will eat', 'I cook'], answer: 'I am eating' },
    { id: 105, conceptId: 'telugu_verb_past_aa', skill: 'grammar', difficultyB: 1150, question: '"ఆమె వచ్చింది" means?', options: ['She comes', 'She is coming', 'She came', 'She will come'], answer: 'She came' },
    { id: 106, conceptId: 'telugu_vibhakti_dative', skill: 'grammar', difficultyB: 1250, question: 'In "నాకు ఇల్లు ఇవ్వు" (give me the house), "నాకు" is which case?', options: ['Nominative', 'Accusative', 'Dative', 'Locative'], answer: 'Dative' },
    { id: 107, conceptId: 'telugu_syntax_sov', skill: 'grammar', difficultyB: 1350, question: 'Telugu word order is primarily?', options: ['SVO', 'SOV', 'VSO', 'Free order'], answer: 'SOV' },
    { id: 108, conceptId: 'telugu_questions_aa', skill: 'grammar', difficultyB: 1450, question: 'To form "Did he come?" from "వాడు వచ్చాడు", you?', options: ['Add -aa to the verb', 'Reverse word order', 'Add enti prefix', 'Change to future tense'], answer: 'Add -aa to the verb' },
  ],
  kannada: [
    { id: 201, conceptId: 'kannada_vocab_greetings', skill: 'vocabulary', difficultyB: 750, question: '"ನಮಸ್ಕಾರ" (Namaskara) means?', options: ['Hello/Greetings', 'Goodbye', 'Please', 'Sorry'], answer: 'Hello/Greetings' },
    { id: 202, conceptId: 'kannada_pronouns_neenu_neevu', skill: 'grammar', difficultyB: 950, question: '"ನೀವು" (Neevu) vs "ನೀನು" (Neenu)?', options: ['Formal vs informal you', 'We vs I', 'He vs she', 'Past vs present'], answer: 'Formal vs informal you' },
    { id: 203, conceptId: 'kannada_verb_present', skill: 'grammar', difficultyB: 1050, question: '"ನಾನು ಓದುತ್ತೇನೆ" means?', options: ['I read (past)', 'I am reading', 'I will read', 'I wrote'], answer: 'I am reading' },
    { id: 204, conceptId: 'kannada_verb_past', skill: 'grammar', difficultyB: 1200, question: '"ಅವನು ಬಂದನು" means?', options: ['He comes', 'He is coming', 'He came', 'He goes'], answer: 'He came' },
  ],
};

async function getPool(language: string) {
  const seeded = await db.query.practiceItems
    .findMany({ where: eq(practiceItems.language, language.toLowerCase()) })
    .catch(() => []);
  if (seeded.length >= 5) {
    return seeded.map((r) => {
      const p = r.payload as { question?: string; options?: { text: string }[]; correctAnswer?: string };
      return {
        id: r.id,
        conceptId: r.conceptId,
        skill: r.skill as Skill,
        difficultyB: r.difficultyB,
        question: p.question ?? '',
        options: (p.options ?? []).map((o) => o.text),
        answer: p.correctAnswer ?? '',
      };
    });
  }
  return PLACEMENT_POOL[language.toLowerCase()] ?? PLACEMENT_POOL.telugu;
}

// POST {language, answers[]} → {done:false, next} | {done:true, level, theta}
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || 'guest_demo_user';
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { language, courseId, selfLevel, answers } = parsed.data;

    const pool = await getPool(language);
    let state = initPlacementState(selfLevel);
    for (const a of answers) {
      state = recordPlacementAnswer(state, {
        itemId: a.itemId,
        conceptId: a.conceptId,
        skill: a.skill,
        difficultyB: a.difficultyB,
        correct: a.correct,
      });
    }

    if (placementDone(state)) {
      const result = finalizePlacement(state);
      await persistPlacement(effectiveUserId, courseId, result, state.perSkill);
      return NextResponse.json({ done: true, ...result });
    }

    const next = nextPlacementItem(pool, state);
    if (!next) {
      const result = finalizePlacement(state);
      await persistPlacement(effectiveUserId, courseId, result, state.perSkill);
      return NextResponse.json({ done: true, ...result });
    }
    return NextResponse.json({ done: false, next, answered: answers.length });
  } catch (error) {
    console.error('Placement POST error:', error);
    return NextResponse.json({ error: 'Placement failed' }, { status: 500 });
  }
}

async function persistPlacement(
  userId: string,
  courseId: number,
  result: ReturnType<typeof finalizePlacement>,
  perSkill: Partial<Record<Skill, { elo: number; attempts: number; correct: number }>>
) {
  try {
    const bktPrior = bktPriorForLevel(result.level);
    // Seed knowledge nodes for concepts demonstrated correct
    for (const conceptId of result.passedConcepts) {
      const node = initializeFSRSNode(userId, courseId, conceptId, 'vocabulary');
      await db
        .insert(learnerKnowledgeNodes)
        .values({ ...node, stability: 5, reps: 2, state: 'review' })
        .onConflictDoUpdate({
          target: [learnerKnowledgeNodes.userId, learnerKnowledgeNodes.courseId, learnerKnowledgeNodes.conceptId],
          set: { stability: 5, state: 'review' },
        });
    }
    // Seed skill states from placement theta
    for (const skill of SKILL_KEYS) {
      const s = perSkill[skill];
      await db
        .insert(learnerSkillState)
        .values({
          userId,
          courseId,
          skill,
          elo: s?.elo ?? result.theta,
          bktKnown: bktPrior,
          attempts: s?.attempts ?? 0,
          correct: s?.correct ?? 0,
        })
        .onConflictDoUpdate({
          target: [learnerSkillState.userId, learnerSkillState.courseId, learnerSkillState.skill],
          set: { elo: s?.elo ?? result.theta, bktKnown: bktPrior, lastSeenAt: new Date() },
        });
    }
    await db
      .insert(userPreferences)
      .values({ userId, currentLevel: result.level, assessmentCompleted: true })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { currentLevel: result.level, assessmentCompleted: true, updatedAt: new Date() },
      });
  } catch (e) {
    console.error('Failed to persist placement results:', e);
  }
}

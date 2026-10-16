import "dotenv/config";
import db from "../db/drizzle";
import * as schema from "../db/schema";
import { PRACTICE_ITEMS, SPOKEN_CONTENT } from "./seed-content";
import { getConceptById } from "../lib/ai/adaptive/knowledge-graph";
import { createHash } from "crypto";

// Concept level (1-5) → Elo beta
const betaForConcept = (conceptId: string) =>
  1000 + ((getConceptById(conceptId)?.level ?? 2) - 3) * 150;

const main = async () => {
  try{
    console.log("Seeding database...");

    await db.delete(schema.courses);
    await db.delete(schema.userProgress);
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.challenges);
    await db.delete(schema.challengeOptions);
    await db.delete(schema.challengeProgress);

    await db.insert(schema.courses).values([
      {
        id: 1,
        title: "Telugu",
        imageSrc: "/tel.svg"
      },
      {
        id: 2,
        title: "Hindi",
        imageSrc: "/hindi.svg"
      },
      {
        id: 3,
        title: "Kannada",
        imageSrc: "/kan.svg"
      },
    ])

    await db.insert(schema.units).values([
      {
        id: 1,
        title: "Unit 1",
        description: "Learn basics of telugu",
        courseId: 1,
        order: 1,
      },
    ]);

    await db.insert(schema.lessons).values([
      {
        id: 1,
        title: "Noun",
        unitId: 1,
        order: 1,
      },
      // {
      //   id: 2,
      //   title: "Verbs",
      //   unitId: 1,
      //   order: 2,
      // },
    ]);
    await db.insert(schema.challenges).values([
      {
        id: 1,
        lessonId: 1,
        type: "SELECT",
        question: 'What is called "bed"? ',
        order: 1,
        conceptId: "telugu_vocab_family",
        skill: "vocabulary",
        itemDifficulty: betaForConcept("telugu_vocab_family"),
      },
      // {
      //   id: 2,
      //   lessonId: 2,
      //   type: "ASSIST",
      //   question: "How do you say 'to run' in Telugu?",
      //   order: 2,
      // },
    ]);
    await db.insert(schema.challengeOptions).values([
      {
        id: 1,
        challengeId: 1,
        imageSrc: "/bed.svg",
        correct: true,
        text: "మంచం",
        audioSrc: "/mancham.mp3",
      },
      {
        id: 2,
        challengeId: 1,
        imageSrc: "/chair.svg",
        correct: false,
        text: "కుర్చీ",
        audioSrc: "/kurchi.mp3",
      },
      {
        id: 3,
        challengeId: 1,
        imageSrc: "/rangamu.svg",
        correct: false,
        text: "రంగము",
        audioSrc: "/rangamu.mp3",
      },
      {
        id: 4,
        challengeId: 1,
        imageSrc: "/suryudu.svg",
        correct: false,
        text: "సూర్యుడు",
        audioSrc: "/suryudu.mp3",
      },
    ]);
    // ── Adaptive-path content ──────────────────────────────────────────────
    await db.delete(schema.practiceItems);
    await db.delete(schema.spokenContent);

    for (const item of PRACTICE_ITEMS) {
      const contentHash = createHash("sha256")
        .update(`${item.language}:${item.conceptId}:${item.payload.question}`)
        .digest("hex")
        .slice(0, 32);
      await db
        .insert(schema.practiceItems)
        .values({
          language: item.language,
          conceptId: item.conceptId,
          skill: item.skill,
          type: item.type,
          payload: item.payload,
          difficultyB: betaForConcept(item.conceptId),
          reviewStatus: "seeded",
          source: "seed",
          contentHash,
        })
        .onConflictDoNothing();
    }

    for (const s of SPOKEN_CONTENT) {
      const contentHash = createHash("sha256")
        .update(`${s.language}:${s.nativeText}`)
        .digest("hex")
        .slice(0, 32);
      await db
        .insert(schema.spokenContent)
        .values({
          language: s.language,
          kind: s.kind,
          nativeText: s.nativeText,
          translit: s.translit,
          gloss: s.gloss,
          register: s.register,
          region: s.region ?? null,
          example: s.example ?? null,
          conceptId: s.conceptId ?? null,
          reviewStatus: "unreviewed",
          contentHash,
        })
        .onConflictDoNothing();
    }
    console.log(
      `Seeded ${PRACTICE_ITEMS.length} practice items, ${SPOKEN_CONTENT.length} spoken-content rows`
    );

    // ── Demo learner profile — makes the adaptive surfaces visible on first
    // run (mastery map, due reviews, skill bars, weak areas, daily plan).
    const DEMO_USER = "guest_demo_user";
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

    await db.delete(schema.learnerKnowledgeNodes);
    await db.delete(schema.learnerSkillState);
    await db.delete(schema.learnerItems);
    await db.delete(schema.learnerSessions);
    await db.delete(schema.recommendationLog);

    const demoNodes = [
      // overdue review — should surface at the top of Today's Plan
      { conceptId: "telugu_vocab_greetings", conceptType: "vocabulary", stability: 8, difficulty: 4, retrievability: 0.7, lastReviewedAt: daysAgo(6), dueAt: daysAgo(1), reps: 4, lapses: 0, state: "review" },
      { conceptId: "telugu_vocab_numbers_1_10", conceptType: "vocabulary", stability: 4, difficulty: 5, retrievability: 0.62, lastReviewedAt: daysAgo(5), dueAt: daysAgo(2), reps: 3, lapses: 1, state: "review" },
      { conceptId: "telugu_script_vowels_short", conceptType: "script", stability: 1.2, difficulty: 6, retrievability: 0.55, lastReviewedAt: daysAgo(2), dueAt: daysAgo(0.5), reps: 2, lapses: 1, state: "learning" },
      // healthy — not due yet
      { conceptId: "telugu_pronouns_basic", conceptType: "honorific", stability: 3, difficulty: 5, retrievability: 0.85, lastReviewedAt: daysAgo(1), dueAt: new Date(now.getTime() + 86400000), reps: 2, lapses: 0, state: "learning" },
      // mastered
      { conceptId: "telugu_vocab_family", conceptType: "vocabulary", stability: 14, difficulty: 3, retrievability: 0.9, lastReviewedAt: daysAgo(8), dueAt: new Date(now.getTime() + 7 * 86400000), reps: 6, lapses: 0, state: "mastered" },
    ];
    for (const n of demoNodes) {
      await db.insert(schema.learnerKnowledgeNodes).values({
        userId: DEMO_USER,
        courseId: 1,
        ...n,
      }).onConflictDoNothing();
    }

    const demoSkills = [
      { skill: "vocabulary", elo: 1030, bktKnown: 0.72, attempts: 14, correct: 10 },
      { skill: "script", elo: 990, bktKnown: 0.55, attempts: 8, correct: 5 },
      { skill: "grammar", elo: 960, bktKnown: 0.48, attempts: 9, correct: 5 },
      { skill: "conversation", elo: 1010, bktKnown: 0.6, attempts: 4, correct: 3 },
      { skill: "listening", elo: 1000, bktKnown: 0.4, attempts: 0, correct: 0 },
      { skill: "speaking", elo: 1000, bktKnown: 0.4, attempts: 0, correct: 0 },
    ];
    for (const s of demoSkills) {
      await db.insert(schema.learnerSkillState).values({
        userId: DEMO_USER,
        courseId: 1,
        ...s,
      }).onConflictDoNothing();
    }

    // Sessions incl. recurring pragmatic errors → weak-area insight lights up
    const demoSessions = [
      { conceptId: "telugu_vocab_greetings", skill: "vocabulary", source: "lesson", userAnswer: "Namaskaram", isCorrect: true, latencyMs: 2400, errorClassification: "none", createdAt: daysAgo(6) },
      { conceptId: "telugu_pronouns_basic", skill: "grammar", source: "lesson", userAnswer: "nuvvu", isCorrect: false, latencyMs: 5200, errorClassification: "pragmatic", explanation: "Used informal 'you' where honorific is expected (meeru)", createdAt: daysAgo(3) },
      { conceptId: "telugu_pronouns_basic", skill: "grammar", source: "practice", userAnswer: "nuvvu", isCorrect: false, latencyMs: 6100, errorClassification: "pragmatic", explanation: "Used informal 'you' where honorific is expected (meeru)", createdAt: daysAgo(2) },
      { conceptId: "telugu_script_vowels_short", skill: "script", source: "practice", userAnswer: "ఆ", isCorrect: false, latencyMs: 4300, errorClassification: "phonetic", explanation: "Confused short అ with long ఆ", createdAt: daysAgo(2) },
      { conceptId: "telugu_vocab_numbers_1_10", skill: "vocabulary", source: "practice", userAnswer: "Seven", isCorrect: false, latencyMs: 3800, errorClassification: "none", createdAt: daysAgo(5) },
      { conceptId: "telugu_vocab_family", skill: "vocabulary", source: "lesson", userAnswer: "Mother", isCorrect: true, latencyMs: 1800, errorClassification: "none", createdAt: daysAgo(8) },
      { conceptId: "telugu_syntax_sov", skill: "grammar", source: "lesson", userAnswer: "నీళ్ళు నేను త్రాగుతాను", isCorrect: false, latencyMs: 9000, errorClassification: "syntax", explanation: "Word order: expected SOV (నేను నీళ్ళు త్రాగుతాను)", createdAt: daysAgo(1) },
      { conceptId: "telugu_vocab_greetings", skill: "vocabulary", source: "chat", userAnswer: "Namaskaram Priya!", isCorrect: true, latencyMs: 12000, errorClassification: "none", createdAt: daysAgo(1) },
    ];
    for (const sRow of demoSessions) {
      await db.insert(schema.learnerSessions).values({
        userId: DEMO_USER,
        courseId: 1,
        challengeId: `demo_${sRow.conceptId}`,
        hintsUsed: 0,
        ...sRow,
      });
    }

    // A couple of item-level memories (slang learned in chat)
    const demoItems = [
      { itemKey: "telugu_slang:చాలు", itemType: "slang", conceptId: "telugu_vocab_greetings", stability: 2, difficulty: 4, retrievability: 0.8, lastReviewedAt: daysAgo(1), dueAt: new Date(now.getTime() + 86400000), reps: 1, lapses: 0, state: "learning" },
      { itemKey: "telugu_word:నీళ్ళు", itemType: "word", conceptId: "telugu_vocab_food", stability: 1, difficulty: 5, retrievability: 0.6, lastReviewedAt: daysAgo(2), dueAt: daysAgo(0.5), reps: 1, lapses: 1, state: "learning" },
    ];
    for (const it of demoItems) {
      await db.insert(schema.learnerItems).values({
        userId: DEMO_USER,
        courseId: 1,
        ...it,
      }).onConflictDoNothing();
    }
    console.log("Seeded demo learner profile for", DEMO_USER);

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error( error);
    process.exit(1);
  }
};
main().then(() => process.exit(0));
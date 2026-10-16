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

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error( error);
    throw new Error("Seeding failed");
  }
};
main();
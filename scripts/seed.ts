import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

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
        imageSrc: "/hin.svg"
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
      {
        id: 2,
        title: "Verbs",
        unitId: 1,
        order: 2,
      },
    ]);
    await db.insert(schema.challenges).values([
      {
        id: 1,
        lessonId: 1,
        type: "SELECT",
        question: 'What is called "bed"? ',
        order: 1,
      },
      {
        id: 2,
        lessonId: 2,
        type: "ASSIST",
        question: "How do you say 'to run' in Telugu?",
        order: 2,
      },
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
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error( error);
    throw new Error("Seeding failed");
  }
};
main();
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

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error( error);
    throw new Error("Seeding failed");
  }
};
main();
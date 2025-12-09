import "dotenv/config";
import type { Config } from "drizzle-kit";
import { isDriverValueEncoder } from "drizzle-orm";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  driver: "pg",
    dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
    },
} satisfies Config;
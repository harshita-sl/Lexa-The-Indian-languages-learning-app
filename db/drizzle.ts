import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { setDefaultAutoSelectFamily } from "net";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import * as schema from "./schema";

// Networks with blackholed IPv6 (common on Indian mobile hotspots / sandboxes)
// stall undici's happy-eyeballs; sequential attempts in DNS order are reliable.
try { setDefaultAutoSelectFamily(false); } catch {}

export type Db = NeonHttpDatabase<typeof schema>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;

  // Embedded Postgres (WASM) — zero-config local dev and CI tests.
  if (!url || url.startsWith("pglite:")) {
    const dataDir = resolve(url?.replace(/^pglite:\/\//, "").replace(/^pglite:/, "") || ".local/lexa.db");
    mkdirSync(dirname(dataDir), { recursive: true });
    return drizzlePglite(new PGlite(dataDir), { schema }) as unknown as Db;
  }

  // Neon serverless driver speaks HTTPS (works when outbound 5432 is blocked).
  if (url.includes("neon.tech")) {
    return drizzleNeon(neon(url), { schema });
  }

  // Generic Postgres over TCP (local docker, RDS, Supabase, ...).
  return drizzlePg(new Pool({ connectionString: url }), { schema }) as unknown as Db;
}

const db = createDb();

export default db;

import "dotenv/config";
import { readdirSync, readFileSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { setDefaultAutoSelectFamily } from "net";

// Networks with blackholed IPv6 stall undici's happy-eyeballs; sequential
// attempts in DNS order are reliable.
setDefaultAutoSelectFamily(false);

const url = process.env.DATABASE_URL;
const drizzleDir = join(__dirname, "..", "drizzle");

interface Queryable {
  query: (text: string, params?: unknown[]) => Promise<unknown>;
}

const listMigrationFiles = () =>
  readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

const splitStatements = (file: string) =>
  readFileSync(join(drizzleDir, file), "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

async function applyWithTracking(run: Queryable) {
  await run.query(`CREATE TABLE IF NOT EXISTS _lexa_migrations (
    id serial PRIMARY KEY,
    filename text NOT NULL UNIQUE,
    applied_at bigint NOT NULL
  )`);
  try {
    await run.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log("pgvector extension enabled");
  } catch {
    console.warn("pgvector unavailable on this database — enable later if needed");
  }

  const applied = (await run.query(`SELECT filename FROM _lexa_migrations`)) as { rows?: { filename: string }[] } | { filename: string }[];
  const appliedRows = Array.isArray(applied) ? applied : applied.rows || [];
  const appliedSet = new Set(appliedRows.map((r) => r.filename));

  for (const file of listMigrationFiles()) {
    if (appliedSet.has(file)) {
      console.log(`skip    ${file} (already applied)`);
      continue;
    }
    for (const stmt of splitStatements(file)) {
      await run.query(stmt);
    }
    await run.query(`INSERT INTO _lexa_migrations (filename, applied_at) VALUES ($1, $2)`, [file, Date.now()]);
    console.log(`applied ${file}`);
  }
}

const main = async () => {
  if (!url || url.startsWith("pglite:")) {
    // Embedded Postgres — drizzle's native migrator reads the journal directly.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const dataDir = resolve(url?.replace(/^pglite:\/\//, "").replace(/^pglite:/, "") || ".local/lexa.db");
    mkdirSync(dirname(dataDir), { recursive: true });
    const db = drizzle(new PGlite(dataDir));
    await migrate(db, { migrationsFolder: drizzleDir });
    try {
      await db.$client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
      console.log("pgvector extension enabled");
    } catch {
      console.warn("pgvector extension not bundled in PGlite — ok for now");
    }
    console.log("PGlite migrations applied to", dataDir);
    return;
  }

  if (url.includes("neon.tech")) {
    // Neon's HTTPS endpoint — works where outbound TCP 5432 is blocked.
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await applyWithTracking({ query: (t, p) => sql.query(t, (p || []) as never[]) });
    console.log("Neon migrations complete.");
    return;
  }

  // Generic Postgres over TCP.
  const { Client } = await import("pg");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await applyWithTracking(client);
    console.log("Migrations complete.");
  } finally {
    await client.end();
  }
};

main().catch((e) => {
  console.error("Migration failed:", e.message || e);
  process.exit(1);
});

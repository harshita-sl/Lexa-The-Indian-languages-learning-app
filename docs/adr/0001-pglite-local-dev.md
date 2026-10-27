# ADR-0001: PGlite for zero-config local development

**Status:** Accepted (Phase 0)

**Context.** Local dev previously required a Neon `DATABASE_URL`; sandboxes
and Indian mobile hotspots often have IPv6 blackholes and/or outbound 5432
blocked, making Neon setup flaky (we hit both).

**Decision.** `db/drizzle.ts` picks a driver by `DATABASE_URL` shape:

- unset or `pglite:` → embedded PGlite (WASM Postgres) at `.local/lexa.db`
- `*.neon.tech` → Neon serverless driver (HTTPS, port 443)
- otherwise → `pg` Pool (docker, RDS, Supabase)

`setDefaultAutoSelectFamily(false)` avoids undici happy-eyeballs stalls on
IPv6-blackholed networks.

**Consequences.** `npm install && npm run db:migrate && npm run db:seed`
just works — no external service. pgvector unavailable under PGlite; migrate
script tolerates that (vector columns deferred). Production unchanged.

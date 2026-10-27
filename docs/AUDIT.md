# Lexa — Architecture Audit (Phase 0)

_Audit date: Oct 2026. Baseline: `master` as cloned from
github.com/harshita-sl/Lexa-The-Indian-languages-learning-app._

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TS strict | Route groups: `(marketing)` `/`, `(main)` authenticated app |
| DB | Drizzle ORM → Neon Postgres (prod), **PGlite (local, zero-config)**, generic `pg` pool | Driver picked by `DATABASE_URL` shape in `db/drizzle.ts` |
| Auth | Clerk (`@clerk/nextjs`, middleware) | Free tier ≤10k MAU |
| UI | Tailwind v4 + shadcn-style components + Radix | |
| AI | Gemini (`@google/generative-ai`), OpenAI, Pollinations (image) | Now behind `lib/ai/llm.ts` adapter; env-swappable |
| Tests | Vitest (added in Phase 0) | 26 unit tests green |
| CI | GitHub Actions (added in Phase 0) | lint → typecheck → unit tests → build |

## 2. DB schema (`db/schema.ts`)

Fixed-path curriculum: `courses → units → lessons → challenges →
challenge_options`, plus `challenge_progress`, `user_progress`.

Adaptive layer (partially scaffolded pre-Phase-0):
- `user_preferences` — nativeLanguage, currentLevel, dailyGoalMinutes,
  targetRegister, transliterationMode, assessmentCompleted
- `learner_knowledge_nodes` — per-concept FSRS fields (stability, difficulty,
  retrievability, dueAt, reps, lapses, state)
- `learner_sessions` — per-attempt event log (correctness, latency, error
  class, acoustic score, explanation)
- `conversations`, `ai_generated_content` (LLM cache; unique index on
  `(content_type, input_hash)` added in Phase 0)

**Gaps for the mission:** no onboarding-goal field usage, no per-skill
aggregate, no ability (Elo/IRT) columns, no review-status workflow on
generated linguistic content, no recommendation-reason log table.

## 3. What works

- Marketing landing `/`, course list `/courses`, lesson tree `/learn`,
  lesson runner `/learn/lesson/[id]`, `/assessment`, `/profile`.
- AI tutor chat modal (`/api/ai/tutor-chat`), AI challenge generation,
  FSRS endpoints (`/api/ai/fsrs`), user preferences API.
- Adaptive engine core in `lib/ai/adaptive/`: FSRS scheduler
  (`R(t,S) = (1 + 0.19·t/S)^(-0.5)`), ZPD calculator, curriculum mixer
  (40% review / 40% new / 20% remediation), Telugu+Hindi+Kannada concept
  graph with explainable reasons.
- Indic layer in `lib/ai/indic/`: transliteration, honorific evaluation,
  error diagnosis.

## 4. What was broken / fixed in Phase 0

- Build failed: stale `hearts`/`points` props on profile, `any` types in
  FSRS route, `fontally` typo, duplicate PostCSS config (v3 vs v4).
- Sidebar linked to nonexistent `/mastery` and `/practice` → pages added.
- `gemini-1.5-flash` hard-coded everywhere; model retired → provider
  adapter with env config + model fallbacks.
- `clearExpiredCache` compared `expiresAt === now` → fixed to `lt`.
- `ai_generated_content` had `onConflictDoUpdate` without a unique index.
- Local dev required Neon (IPv6 issues in restricted networks) → PGlite.
- `lib/ai/indic/transliteration.ts` greedy consonant bugs (`dhanyavaad`
  → `धञवाद्`, Kannada `ಡ` mis-mapped) — found by new tests, fixed.
- Lint fully clean; 26 unit tests green; `npm run build` green.

## 5. Tech debt / risks

- No Zod validation on API routes; no rate limiting; no structured logging.
- No onboarding flow wired to `user_preferences`; placement test exists
  but not adaptive.
- Voice pipeline absent (only browser SpeechSynthesis in tutor modal).
- Generated content has no review-status lifecycle.
- `npm audit` reports vulnerabilities (deferred — mostly transitive dev deps).
- Neon free tier limits (1 GB, 100 CU-h/mo) — fine for MVP; document.

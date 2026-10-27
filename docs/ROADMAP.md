# Roadmap

**Phase 0 — Foundations (this PR) ✅**
Architecture audit, PGlite local dev, LLM provider adapter, missing routes,
lint/type/build green, Vitest + CI, `.env.example`, docs + ADRs.

**Phase 1 — Adaptive engine**
- Learner model: per-user/per-skill/per-item state; review-event log.
- FSRS-lite (exists) + Elo-lite ability + BKT knowledge tracing.
- Persisted recommendation reasons ("due for review", "weak on X").
- Synthetic-learner simulator + offline metrics (`scripts/simulate.ts`).
- Schema migration: preserve existing users/progress.

**Phase 2 — Onboarding → daily plan**
- Onboarding form (mother tongue, target lang, goal, level, time budget).
- Short adaptive placement test (seeded by priors, ~8 items).
- Daily plan mixing reviews/new/conversation; `/mastery` dashboard with
  weak areas; practice queue uses real engine output.

**Phase 3 — Voice companion (text → speech)**
- Text chat MVP: target-language persona, register-tagged slang
  explanations, transliteration toggle, gentle corrections, role-play
  scenarios (auto-wallah, bargaining, food, friends, in-laws, office).
- Web Speech STT/TTS as free default; `STT_PROVIDER`/`TTS_PROVIDER`
  adapters; graceful text-only fallback; streaming behind flag.
- Rate limits, prompt-injection guardrails, no raw-audio storage by default.

**Phase 4 — Spoken-language KB + pronunciation**
- `spoken_content` table: slang/idioms/phrases, register, region tag,
  examples, `reviewStatus` (`unreviewed` never shown as verified).
- Telugu + Kannada seed packs (~50–100 entries each, curated).
- Slang cards in chat; conversation→review-queue integration.
- Pronunciation feedback: ASR-consistency scoring on shadowing exercises.

**Phase 5 — Extras & polish**
- PWA/offline + low-bandwidth mode, accessibility pass.
- Teacher/native-speaker review UI; Playwright e2e; eval reports in
  `docs/evals/`; performance budgets.

## Parked (revisit after Phase 5)

- DKT/SAKT (needs scale), script tracing, multilingual UI, leagues.
- pgvector RAG (keyword retrieval until corpus size demands it).

## Language expansion rule

Telugu + Kannada fully working first. New languages = **data-only change**
(concept graph + KB pack + transliteration map + seed); no code changes.

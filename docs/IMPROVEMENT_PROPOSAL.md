# Improvement Proposal — ranked by (learning impact × delight) / (effort × risk)

Scored H/M/L. High score = ship early. Items parked in `docs/ROADMAP.md`.

## Ranked backlog

| # | Idea | Impact | Delight | Effort | Risk | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Zero-config local dev (PGlite)** | H | H | L | L | ✅ Done (Phase 0) |
| 2 | **Provider-agnostic LLM adapter + model fallback** | H | M | L | L | ✅ Done (Phase 0) |
| 3 | **Explainable adaptive engine** (FSRS + Elo-lite + BKT, reason log) | H | H | M | M | Phase 1 — core differentiator |
| 4 | **Onboarding + adaptive placement → daily plan** | H | H | M | M | Phase 2 — the "wow" first run |
| 5 | **Text-first voice companion** (persona + RAG, then STT/TTS) | H | H | M | M | Phase 3 — text chat first, speech behind flag |
| 6 | **Spoken-language KB w/ review status** (slang cards, register tags, region) | H | H | M | M | Phase 4 — Tel + Kan first |
| 7 | **Conversation→learner-model loop** (new slang → review queue) | H | M | M | L | Phase 4 |
| 8 | **Zod validation + rate limits + structured logging** | M | — | M | L | Phase 2 spread across routes |
| 9 | **Browser-native STT/TTS default** (Web Speech API) → free, zero keys | M | H | L | L | Phase 3 default; upgrade path Groq Whisper / Sarvam |
| 10 | **Synthetic learner simulator** for engine tuning | M | — | M | L | Phase 1 |
| 11 | **PWA + offline/low-bandwidth mode** | M | H | M | M | Phase 5 |
| 12 | **Teacher/native-speaker review UI** | M | M | M | L | Phase 5 |
| 13 | **Playwright e2e** (onboarding → plan → practice) | M | — | M | L | Phase 5 |
| 14 | **pgvector RAG for spoken KB** | M | M | M | M | Phase 4 (Neon free tier has pgvector; PGlite fallback = keyword match) |
| 15 | **Pronunciation feedback** (ASR WER / phoneme alignment) | M | H | H | H | Phase 4, scoped to shadowing exercises |
| 16 | **DKT/SAKT knowledge tracing** | M | — | H | H | Parked — no data volume; BKT sufficient |
| 17 | **Script tracing / stroke order** | M | M | H | M | Parked (nice-to-have) |
| 18 | **Multilingual UI** | M | M | M | M | Parked until content model stabilises |

## Key trade-off decisions

- **Keep Next.js + Drizzle + Clerk + Tailwind.** Rewriting any of these is
  high-effort/low-impact; all are on generous free tiers.
- **Custom FSRS-lite vs `ts-fsrs`:** custom kept for now — it's tested and
  dependency-free; `ts-fsrs` evaluated as upgrade if scheduling quality
  matters at scale (ADR-0003).
- **BKT over DKT:** cold-start priors + per-skill mastery need
  interpretability; neural KT needs data we don't have yet.
- **Web Speech API as default speech path:** zero cost, zero keys, decent
  Indian-language coverage on Chrome; provider adapters allow
  Groq Whisper / Sarvam upgrades without call-site changes.
- **Sarvam as optional flag, not default:** ₹100 signup credits then paid —
  violates "free-only default" rule. Groq free tier + Web Speech cover the
  default path.
- **Keyword/BM25 retrieval before pgvector:** spoken KB is small (< few
  thousand entries); embedding infra only added if precision suffers.
- **Unreviewed content never presented as verified:** `reviewStatus` on all
  generated linguistic content; LLM output defaults to `unreviewed`.

# ADR-0002: Provider-agnostic LLM adapter

**Status:** Accepted (Phase 0)

**Context.** All AI features hard-coded `@google/generative-ai` with
`gemini-1.5-flash`, which is retired — every request 401s. Provider choice,
model availability, and free-tier limits churn constantly.

**Decision.** `lib/ai/llm.ts` exposes `chatCompletion(system, messages,
opts)` / `chatStream(...)`. Provider selected by `LLM_PROVIDER`
(`gemini`|`groq`|`openai`); models via `GEMINI_MODEL`, `GROQ_MODEL`,
`OPENAI_MODEL` + `OPENAI_BASE_URL` (OpenRouter-compatible). Gemini tries a
fallback model list and caches the first that works.

Callers must handle total failure (cached content, canned responses) —
the adapter throws rather than silently degrading.

**Consequences.** Adding a provider = one env var + ~20 lines. Streaming is
buffered today; SSE swap-in later without call-site changes.

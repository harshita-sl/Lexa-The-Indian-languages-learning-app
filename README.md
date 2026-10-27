# Lexa — Indian language learning, the way people actually talk

Adaptive, AI-powered learning for Telugu & Kannada (and more): colloquial
speech, slang, code-mixing, honorifics, and role-play conversation — not just
textbook phrases.

## Quick start

```bash
npm install
cp .env.example .env.local        # then edit — see keys below
npm run dev                       # http://localhost:3000
```

Zero-config local dev uses an embedded Postgres (`DATABASE_URL="pglite://.local/lexa.db"`)
plus `npm run db:seed` for a demo learner profile.

## Keys

- **AI chat/challenges** — the fastest free fix is Groq (console.groq.com, no
  card): set `LLM_PROVIDER="groq"` and `GROQ_API_KEY` in `.env.local`.
  Gemini (`GEMINI_API_KEY`) is the default provider; OpenAI-compatible
  endpoints also work. **Without a working key the app still runs** — lessons
  and chat fall back to curated offline content (marked "Scripted mode" in
  the chat UI).
- **Speech** — Gnani/Vachana Indic STT+TTS via `GNANI_API_KEY` +
  `SPEECH_STT_PROVIDER=gnani` / `SPEECH_TTS_PROVIDER=gnani` (server-side
  only). Falls back to the browser's Web Speech API when unset.
- **Auth** — Clerk keys; the app runs as `guest_demo_user` without them.

## Learn more

- `docs/AUDIT.md` — codebase audit · `docs/ROADMAP.md` — adaptive roadmap
- `docs/adr/` — architecture decisions · `docs/evals/` — simulator reports

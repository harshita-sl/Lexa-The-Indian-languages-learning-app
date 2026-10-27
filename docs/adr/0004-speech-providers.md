# ADR-0004: Speech provider strategy — Web Speech default, adapters for upgrades

**Status:** Accepted (Phase 0; implements in Phase 3)

**Context.** Mission requires STT→LLM→TTS on free tiers only. Candidates:

| Option | Cost | Indian-lang quality | Notes |
|---|---|---|---|
| Web Speech API | free, local | moderate (Chrome best) | zero keys; default |
| Groq Whisper (large-v3 / turbo) | free tier | good multilingual | 25 MB cap, rate-limited |
| AI4Bharat IndicConformer | free OSS, self-host | best for Tel/Kan | needs infra; Phase 4+ |
| Sarvam (Saaras/Bulbul) | ₹100 credit, then paid | excellent | **flagged optional, not default** |

**Decision.** Adapter interfaces in `lib/` (`STT_PROVIDER`, `TTS_PROVIDER`
env vars). Defaults = browser Web Speech (zero cost/keys). Groq Whisper
STT + Sarvam TTS behind env flags. Always degrade to text-only.

**Consequences.** Works offline-ish on Chrome with no keys; quality upgrades
are config, not code. No raw audio stored unless user opts in.

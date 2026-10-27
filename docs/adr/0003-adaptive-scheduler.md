# ADR-0003: Custom FSRS-lite + Elo-lite + BKT (over ts-fsrs / neural KT)

**Status:** Accepted (Phase 0–1)

**Context.** The mission wants FSRS + ability estimation + knowledge
tracing. `ts-fsrs` is a solid MIT library but targets flashcard vocabulary;
we need a unified model over heterogeneous items (script, listening,
speaking, grammar) with explainable selection.

**Decision.** Keep the in-repo FSRS approximation
(`lib/ai/adaptive/fsrs-scheduler.ts`: R(t,S) = (1+0.19·t/S)^(−0.5), 4-point
rating scale, lapses) plus ZPD-gated curriculum mixing. Add Elo-lite
(per-item difficulty vs per-user ability) and BKT per-skill in Phase 1 —
interpretable, zero dependencies, works with cold-start priors.

**Consequences.** Revisit `ts-fsrs` or a neural KT only if simulation shows
calibration problems at volume. Every recommended task carries a reason —
that requirement constrains model choices more than accuracy does.

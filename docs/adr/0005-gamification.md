# ADR-0005: Remove dark-pattern gamification

**Status:** Accepted (Phase 0)

**Context.** The original clone shipped hearts/XP/leaderboards/quests/shop —
extrinsic mechanics that punish mistakes (anti-learning) and the mission
explicitly calls out dark-pattern gamification as unwanted.

**Decision.** Remove hearts/points from `user_progress` and the profile UI;
`/leaderboard`, `/quests`, `/shop` redirect to `/mastery` / `/practice`.
Mastery %, retention, and streak-of-effort (days practiced, not XP) remain
as motivation.

**Consequences.** Schema already reflects this; stale UI references cleaned
in Phase 0. Any future gamification must reward consistency/mastery, never
penalise errors.

# Adaptive Engine — Simulation Report

_2026-10-19 · 30 simulated days · 3 synthetic learners_

| Learner | true θ drift | Calibration MAE | Ability bias (est − true) | Plan fill |
|---|---|---|---|---|
| sim_strong | mastered 0 concepts | 0.375 | -295 | 100% |
| sim_average | mastered 0 concepts | 0.398 | -66 | 100% |
| sim_weak | mastered 0 concepts | 0.488 | 177 | 100% |

**Cohort calibration MAE: 0.42** — mean |predicted retrievability − actual recall| across review tasks. Note: per-event MAE against binary 0/1 outcomes has a floor (~0.4 even for a perfectly calibrated predictor); the binned table below is the more meaningful calibration view.

### Binned calibration (predicted R vs empirical recall)

| Predicted-R bin | n | mean predicted | actual recall |
|---|---|---|---|
| 0.2–0.4 | 37 | 0.30 | 0.51 |
| 0.4–0.6 | 183 | 0.61 | 0.84 |
| 0.8–1.0 | 31 | 0.89 | 0.84 |

- Ability bias < ~120 means Elo estimates track hidden ability (note: strong learners are underestimated — Elo-lite can't reward items it never serves).
- Binned actual recall should track predicted means within ~0.15.

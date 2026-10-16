# Adaptive Engine — Simulation Report

_2026-10-16 · 30 simulated days · 3 synthetic learners_

| Learner | true θ drift | Calibration MAE | Ability bias (est − true) | Plan fill |
|---|---|---|---|---|
| sim_strong | mastered 0 concepts | 0.384 | -383 | 100% |
| sim_average | mastered 0 concepts | 0.408 | -84 | 100% |
| sim_weak | mastered 0 concepts | 0.443 | 159 | 100% |

**Cohort calibration MAE: 0.412** — mean |predicted retrievability − actual recall| across review tasks. Note: per-event MAE against binary 0/1 outcomes has a floor (~0.4 even for a perfectly calibrated predictor); the binned table below is the more meaningful calibration view.

### Binned calibration (predicted R vs empirical recall)

| Predicted-R bin | n | mean predicted | actual recall |
|---|---|---|---|
| 0.2–0.4 | 35 | 0.34 | 0.75 |
| 0.4–0.6 | 297 | 0.63 | 0.85 |
| 0.8–1.0 | 40 | 0.85 | 0.88 |

- Ability bias < ~120 means Elo estimates track hidden ability (note: strong learners are underestimated — Elo-lite can't reward items it never serves).
- Binned actual recall should track predicted means within ~0.15.

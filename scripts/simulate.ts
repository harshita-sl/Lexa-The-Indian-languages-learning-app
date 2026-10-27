import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { runSimulation } from "../lib/ai/adaptive/simulator";

const main = async () => {
  const days = parseInt(process.argv[2] ?? "30", 10);
  console.log(`Running ${days}-day synthetic learner simulation...`);
  const { results, cohortMAE } = await runSimulation(days);

  const lines: string[] = [
    "# Adaptive Engine — Simulation Report",
    "",
    `_${new Date().toISOString().slice(0, 10)} · ${days} simulated days · 3 synthetic learners_`,
    "",
    "| Learner | true θ drift | Calibration MAE | Ability bias (est − true) | Plan fill |",
    "|---|---|---|---|---|",
  ];

  for (const r of results) {
    const last = r.days[r.days.length - 1];
    lines.push(
      `| ${r.learnerId} | mastered ${last?.masteredConcepts ?? 0} concepts | ${r.calibrationMAE} | ${r.abilityBias} | ${Math.round(r.planFillRate * 100)}% |`
    );
  }

  lines.push(
    "",
    `**Cohort calibration MAE: ${cohortMAE}** — mean |predicted retrievability − actual recall| across review tasks. Note: per-event MAE against binary 0/1 outcomes has a floor (~0.4 even for a perfectly calibrated predictor); the binned table below is the more meaningful calibration view.`,
    "",
    "### Binned calibration (predicted R vs empirical recall)",
    "",
    "| Predicted-R bin | n | mean predicted | actual recall |",
    "|---|---|---|---|",
  );

  const agg = [0, 0.2, 0.4, 0.6, 0.8].map((lo) => ({ lo, hi: lo + 0.2, n: 0, p: 0, a: 0 }));
  for (const r of results) {
    for (const b of r.calibrationBins) {
      const i = Math.min(4, Math.floor(b.lo / 0.2));
      agg[i].n += b.count;
      agg[i].p += b.predictedMean * b.count;
      agg[i].a += b.actualRate * b.count;
    }
  }
  for (const b of agg) {
    if (b.n > 0) {
      lines.push(
        `| ${b.lo.toFixed(1)}–${b.hi.toFixed(1)} | ${b.n} | ${(b.p / b.n).toFixed(2)} | ${(b.a / b.n).toFixed(2)} |`
      );
    }
  }

  lines.push(
    "",
    "- Ability bias < ~120 means Elo estimates track hidden ability (note: strong learners are underestimated — Elo-lite can't reward items it never serves).",
    "- Binned actual recall should track predicted means within ~0.15.",
    ""
  );

  const outPath = join(__dirname, "..", "docs", "evals", "simulator.md");
  mkdirSync(join(outPath, ".."), { recursive: true });
  writeFileSync(outPath, lines.join("\n"));
  console.log(`Report written to ${outPath}`);
  console.log(`Cohort calibration MAE: ${cohortMAE}`);
};

main().catch((e) => {
  console.error("Simulation failed:", e);
  process.exit(1);
});

import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/app/(main)/learn/user-progress";
import { getUserProgress, getCourseById, getLearnerKnowledgeNodes, getLearnerSkillStates, getWeakAreas, getRecentLearnerSessions, getUserPreferences } from "@/db/queries";
import { computeStyle } from "@/lib/ai/adaptive/style-inference";
import { paceTier } from "@/lib/ai/adaptive/lesson-composer";
import { LearnAITutorButton } from "@/components/learn-ai-tutor-button";
import {
  getLanguageGraph,
  calculateMasteryStatus,
} from "@/lib/ai/adaptive/knowledge-graph";
import { calculateZPD } from "@/lib/ai/adaptive/zpd-calculator";
import { calculateRetrievability, FSRSNode } from "@/lib/ai/adaptive/fsrs-scheduler";
import { cn } from "@/lib/utils";
import { Brain, Target, RefreshCw, Sparkles, AlertTriangle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DECAY_STYLES: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-red-100 text-red-800 border-red-300",
  unseen: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export default async function MasteryPage() {
  const userProgress = await getUserProgress();
  const activeCourse = userProgress?.activeCourseId
    ? await getCourseById(userProgress.activeCourseId)
    : { id: 1, title: "Telugu", imageSrc: "/tel.svg" };

  const language = activeCourse.title.toLowerCase();
  const rows = await getLearnerKnowledgeNodes(activeCourse.id);
  const now = new Date();

  const nodes: FSRSNode[] = rows.map((n) => {
    const lastRev = n.lastReviewedAt ? new Date(n.lastReviewedAt) : now;
    const daysSince = (now.getTime() - lastRev.getTime()) / 86400000;
    return {
      id: n.id,
      userId: n.userId,
      courseId: n.courseId,
      conceptId: n.conceptId,
      conceptType: n.conceptType as FSRSNode["conceptType"],
      stability: n.stability,
      difficulty: n.difficulty,
      retrievability: calculateRetrievability(daysSince, n.stability),
      lastReviewedAt: lastRev,
      dueAt: n.dueAt ? new Date(n.dueAt) : now,
      reps: n.reps,
      lapses: n.lapses,
      state: n.state as FSRSNode["state"],
    };
  });

  const graph = getLanguageGraph(language);
  const snapshots = nodes.map((n) => ({ ...calculateMasteryStatus(n), node: n }));
  const snapshotByConcept = new Map(snapshots.map((s) => [s.conceptId, s]));
  const zpdCandidates = calculateZPD(language, nodes);

  const skillRows = await getLearnerSkillStates(activeCourse.id);
  const weakAreas = await getWeakAreas(40);

  const [prefs, sessions] = await Promise.all([
    getUserPreferences(),
    getRecentLearnerSessions(25),
  ]);
  const styleProfile = computeStyle(
    prefs?.learningStyle,
    sessions.map((s) => ({
      skill: s.skill,
      isCorrect: s.isCorrect,
      latencyMs: s.latencyMs,
    }))
  );
  const rollingAcc = sessions.length
    ? sessions.filter((s) => s.isCorrect).length / sessions.length
    : 0.75;
  const pace = paceTier(rollingAcc, sessions.length);

  const dueCount = snapshots.filter((s) => s.dueStatus === "due" || s.dueStatus === "overdue").length;
  const masteredCount = snapshots.filter((s) => s.node.state === "mastered").length;
  const avgRetention = snapshots.length
    ? Math.round((snapshots.reduce((a, s) => a + s.retrievability, 0) / snapshots.length) * 100)
    : 0;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress activeCourse={activeCourse} hasActiveSubscription={false} />
        <LearnAITutorButton language={activeCourse.title} />
      </StickyWrapper>

      <FeedWrapper>
        <h1 className="text-2xl font-extrabold text-neutral-800 mb-1 flex items-center gap-2">
          <Brain className="w-7 h-7 text-indigo-500" /> {activeCourse.title} Mastery Map
        </h1>
        <p className="text-neutral-500 text-sm mb-6 font-medium">
          Live memory model — every concept has a decay estimate from spaced repetition.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white">
            <p className="text-2xl font-extrabold text-indigo-600">{avgRetention}%</p>
            <p className="text-xs text-neutral-500 font-semibold">Avg. retention</p>
          </div>
          <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white">
            <p className="text-2xl font-extrabold text-red-500">{dueCount}</p>
            <p className="text-xs text-neutral-500 font-semibold">Reviews due</p>
          </div>
          <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white">
            <p className="text-2xl font-extrabold text-green-600">
              {masteredCount}/{graph.length}
            </p>
            <p className="text-xs text-neutral-500 font-semibold">Concepts mastered</p>
          </div>
        </div>

        {dueCount > 0 && (
          <Link href="/practice" className="block mb-8">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" /> Practice {dueCount} due review{dueCount === 1 ? "" : "s"}
            </Button>
          </Link>
        )}

        <section className="mb-8">
          <h2 className="font-bold text-neutral-800 text-lg mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" /> Your learning profile
          </h2>
          <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold capitalize">
                Style: {styleProfile.effective}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold capitalize">
                Pace: {pace}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs font-bold">
                {Math.round(rollingAcc * 100)}% recent accuracy · {sessions.length} attempts
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              {styleProfile.inferred && styleProfile.inferred !== styleProfile.declared
                ? `You chose "${styleProfile.declared}", but your results say you learn best via ${styleProfile.inferred} — lessons now lean that way.`
                : styleProfile.evidence < 15
                  ? `You chose "${styleProfile.declared}". After ~15 exercises we'll start auto-tuning this based on your results.`
                  : `Matches your "${styleProfile.declared}" preference — lesson types are tuned to it.`}
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="font-bold text-neutral-800 text-lg mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-500" /> Skill ability
          </h2>
          <div className="space-y-3">
            {(["vocabulary", "script", "listening", "speaking", "grammar", "conversation"] as const).map((skill) => {
              const row = skillRows.find((r) => r.skill === skill);
              const known = row ? Math.round(row.bktKnown * 100) : 0;
              const attempts = row?.attempts ?? 0;
              return (
                <div key={skill} className="p-3 rounded-2xl border-2 border-neutral-200 bg-white">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-neutral-800 capitalize">{skill}</span>
                    <span className="text-xs font-semibold text-neutral-500">
                      {attempts > 0 ? `${known}% mastery · ${attempts} attempts` : "no data yet"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        known >= 70 ? "bg-green-500" : known >= 40 ? "bg-amber-400" : "bg-sky-400"
                      )}
                      style={{ width: `${Math.max(attempts > 0 ? known : 0, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {weakAreas.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold text-neutral-800 text-lg mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Weak areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {weakAreas.map((w) => (
                <span
                  key={w.dimension}
                  className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
                >
                  {w.dimension.replace(/_/g, " ")} · {w.count}
                </span>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Detected from your recent errors — your daily plan already includes remediation for these.
            </p>
          </section>
        )}

        <section className="mb-8">
          <h2 className="font-bold text-neutral-800 text-lg mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Recommended next (i+1)
          </h2>
          <div className="space-y-2">
            {zpdCandidates.slice(0, 5).map((c) => (
              <div key={c.concept.id} className="p-4 rounded-2xl border-2 border-neutral-200 bg-white flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-neutral-800 text-sm">{c.concept.label}</p>
                  <p className="text-xs text-neutral-500">{c.reason}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">
                  {Math.round(c.readinessScore * 100)}% ready
                </span>
              </div>
            ))}
            {zpdCandidates.length === 0 && (
              <p className="text-sm text-neutral-500">Complete a lesson to unlock your learning frontier.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-neutral-800 text-lg mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-500" /> Concept heatmap
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {graph.map((concept) => {
              const snap = snapshotByConcept.get(concept.id);
              const color = snap ? snap.decayColor : "unseen";
              return (
                <div key={concept.id} className={cn("p-4 rounded-2xl border-2", DECAY_STYLES[color])}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{concept.label}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                      {snap ? snap.dueStatus : "unseen"}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-1">{concept.description}</p>
                  <p className="text-xs font-bold mt-2">
                    {snap ? `${snap.masteryPercent}% retention · S=${snap.stabilityDays}d` : "Not started"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </FeedWrapper>
    </div>
  );
}

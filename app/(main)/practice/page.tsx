import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/app/(main)/learn/user-progress";
import { getUserProgress, getCourseById, getLearnerKnowledgeNodes } from "@/db/queries";
import { LearnAITutorButton } from "@/components/learn-ai-tutor-button";
import { calculateRetrievability } from "@/lib/ai/adaptive/fsrs-scheduler";
import { getConceptById } from "@/lib/ai/adaptive/knowledge-graph";
import { PracticeSession } from "@/components/practice-session";
import { RefreshCw } from "lucide-react";

export interface DueReviewItem {
  conceptId: string;
  conceptType: string;
  label: string;
  description: string;
  retrievability: number;
  courseId: number;
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ conceptId?: string }>;
}) {
  const params = await searchParams;
  const userProgress = await getUserProgress();
  const activeCourse = userProgress?.activeCourseId
    ? await getCourseById(userProgress.activeCourseId)
    : { id: 1, title: "Telugu", imageSrc: "/tel.svg" };

  const rows = await getLearnerKnowledgeNodes(activeCourse.id);
  const now = new Date();

  let dueItems: DueReviewItem[] = rows
    .map((n) => {
      const lastRev = n.lastReviewedAt ? new Date(n.lastReviewedAt) : now;
      const daysSince = (now.getTime() - lastRev.getTime()) / 86400000;
      const r = calculateRetrievability(daysSince, n.stability || 1);
      const dueAt = n.dueAt ? new Date(n.dueAt) : now;
      const concept = getConceptById(n.conceptId);
      return {
        conceptId: n.conceptId,
        conceptType: n.conceptType,
        label: concept?.label || n.conceptId,
        description: concept?.description || "",
        retrievability: r,
        isDue: r < 0.88 || now >= dueAt,
        courseId: n.courseId,
      };
    })
    .filter((i) => i.isDue)
    .sort((a, b) => a.retrievability - b.retrievability)
    .map(({ isDue: _d, ...rest }) => rest);

  // Deep link from Today's Plan — target a single concept even if not due
  if (params.conceptId) {
    const concept = getConceptById(params.conceptId);
    if (concept) {
      const existing = rows.find((n) => n.conceptId === params.conceptId);
      const lastRev = existing?.lastReviewedAt ? new Date(existing.lastReviewedAt) : now;
      const daysSince = (now.getTime() - lastRev.getTime()) / 86400000;
      dueItems = [
        {
          conceptId: concept.id,
          conceptType: existing?.conceptType ?? concept.type,
          label: concept.label,
          description: concept.description,
          retrievability: existing
            ? calculateRetrievability(daysSince, existing.stability || 1)
            : 0,
          courseId: activeCourse.id,
        },
        ...dueItems.filter((i) => i.conceptId !== concept.id),
      ];
    }
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress activeCourse={activeCourse} hasActiveSubscription={false} />
        <LearnAITutorButton language={activeCourse.title} />
      </StickyWrapper>

      <FeedWrapper>
        <h1 className="text-2xl font-extrabold text-neutral-800 mb-1 flex items-center gap-2">
          <RefreshCw className="w-7 h-7 text-emerald-500" /> Spaced Review
        </h1>
        <p className="text-neutral-500 text-sm mb-6 font-medium">
          Rate how well you remembered each concept — the FSRS scheduler picks your next review date.
        </p>

        <PracticeSession
          items={dueItems}
          language={activeCourse.title}
          courseId={activeCourse.id}
        />
      </FeedWrapper>
    </div>
  );
}

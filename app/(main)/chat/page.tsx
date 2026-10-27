import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/app/(main)/learn/user-progress";
import { getUserProgress, getCourseById, getUserPreferences } from "@/db/queries";
import { LearnAITutorButton } from "@/components/learn-ai-tutor-button";
import { ChatCompanion } from "@/components/chat-companion";
import { MessageCircle } from "lucide-react";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const params = await searchParams;
  const userProgress = await getUserProgress();
  const prefs = await getUserPreferences();

  let activeCourse = userProgress?.activeCourseId
    ? await getCourseById(userProgress.activeCourseId)
    : { id: 1, title: "Telugu", imageSrc: "/tel.svg" };

  if (params.language) {
    const lang = params.language.toLowerCase();
    if (lang.includes("kannada")) activeCourse = await getCourseById(3);
    else if (lang.includes("hindi")) activeCourse = await getCourseById(2);
    else if (lang.includes("telugu")) activeCourse = await getCourseById(1);
  }

  const level = (["beginner", "intermediate", "advanced"] as const).includes(
    prefs.currentLevel as never
  )
    ? (prefs.currentLevel as "beginner" | "intermediate" | "advanced")
    : "beginner";

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress activeCourse={activeCourse} hasActiveSubscription={false} />
        <LearnAITutorButton language={activeCourse.title} />
      </StickyWrapper>

      <FeedWrapper>
        <h1 className="text-2xl font-extrabold text-neutral-800 mb-1 flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-indigo-500" /> Talk in {activeCourse.title}
        </h1>
        <p className="text-neutral-500 text-sm mb-4 font-medium">
          A local friend who teaches you how people actually speak — slang, register, and all.
        </p>
        <ChatCompanion
          language={activeCourse.title}
          courseId={activeCourse.id}
          userLevel={level}
        />
      </FeedWrapper>
    </div>
  );
}

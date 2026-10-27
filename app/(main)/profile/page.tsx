import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/app/(main)/learn/user-progress";
import { getUserProgress, getCourseById } from "@/db/queries";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Flame, Star, Heart, Award, Sparkles, BookOpen } from "lucide-react";
import { LearnAITutorButton } from "@/components/learn-ai-tutor-button";

export default async function ProfilePage() {
  const userProgress = await getUserProgress();

  if (!userProgress) {
    redirect("/courses");
  }

  const activeCourse = userProgress.activeCourseId 
    ? await getCourseById(userProgress.activeCourseId) 
    : { id: 1, title: "Telugu", imageSrc: "/tel.svg" };

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={activeCourse}
          hasActiveSubscription={false}
        />
        <LearnAITutorButton language={activeCourse.title} />
      </StickyWrapper>

      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4 rounded-full border-4 border-sky-400 overflow-hidden shadow-lg bg-sky-50">
            <Image src={userProgress.userImageSrc || "/mascot.svg"} alt="User Avatar" fill className="object-cover" />
          </div>

          <h1 className="text-center font-extrabold text-2xl text-neutral-800">
            {userProgress.userName || "Learner"}
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6 flex items-center gap-1.5 font-medium">
            <BookOpen className="w-4 h-4 text-sky-500" />
            Learning <span className="font-bold text-neutral-800">{activeCourse.title}</span> • Beginner Level
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-500">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-neutral-800">
                  {userProgress.lastActiveAt &&
                  new Date(userProgress.lastActiveAt).toDateString() === new Date().toDateString()
                    ? "Today"
                    : "—"}
                </p>
                <p className="text-xs text-neutral-500 font-semibold">Last Active</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-500">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-neutral-800">{userProgress.completedChallenges || 0}</p>
                <p className="text-xs text-neutral-500 font-semibold">Challenges Done</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl text-red-500">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-neutral-800">{Math.round((userProgress.accuracyRate ?? 1) * 100)}%</p>
                <p className="text-xs text-neutral-500 font-semibold">Accuracy</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-white flex items-center gap-3">
              <div className="p-3 bg-sky-100 rounded-xl text-sky-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-neutral-800">Rank #6</p>
                <p className="text-xs text-neutral-500 font-semibold">League Standing</p>
              </div>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl border-2 border-neutral-200 p-6 shadow-sm">
            <h3 className="font-bold text-neutral-800 text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Language Achievements
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-neutral-50 flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-700">Telugu Scholar</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Unlocked</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-700">Hindi Novice</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Unlocked</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-700">Kannada Explorer</span>
                <span className="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
}

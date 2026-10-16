import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "./user-progress";
import { getUnits, getUserProgress, getUserPreferences, getCourseById } from "@/db/queries";
import { redirect } from "next/navigation";
import { Header } from "./header";
import { Unit } from "./unit";
import { LearnAITutorButton } from "@/components/learn-ai-tutor-button";
import { TodaysPlan } from "@/components/todays-plan";
import { buildDailyPlan, drizzlePlanRepo, DailyPlan } from "@/lib/ai/adaptive/daily-plan";
import { createMemoryStore, memoryPlanRepo } from "@/lib/ai/adaptive/memory-repo";

interface LessonItem {
  id: number;
  title: string;
  unitId: number;
  order: number;
  completed: boolean;
}

interface UnitItem {
  id: number;
  order: number;
  title: string;
  description: string;
  courseId: number;
  lessons: LessonItem[];
}

const LearnPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ language?: string; courseId?: string }>;
}) => {
  const params = await searchParams;
  const userProgressData = getUserProgress();
  const preferencesData = getUserPreferences();

  const userProgress = await userProgressData;
  const preferences = await preferencesData;

  let activeCourse = userProgress?.activeCourseId 
    ? await getCourseById(userProgress.activeCourseId) 
    : null;

  if (params.courseId) {
    const requestedCourse = await getCourseById(parseInt(params.courseId));
    if (requestedCourse) activeCourse = requestedCourse;
  } else if (params.language) {
    const langLower = params.language.toLowerCase();
    if (langLower.includes("hindi")) {
      activeCourse = await getCourseById(2);
    } else if (langLower.includes("kannada")) {
      activeCourse = await getCourseById(3);
    } else {
      activeCourse = await getCourseById(1);
    }
  }

  if (!activeCourse) {
    activeCourse = { id: 1, title: "Telugu", imageSrc: "/tel.svg" };
  }

  if (!preferences.assessmentCompleted) {
    redirect(`/onboarding`);
  }

  const lang = activeCourse.title; // "Telugu", "Hindi", or "Kannada"

  // Adaptive daily plan — falls back to a cold-start frontier when the
  // learner DB is unreachable (e.g. un-migrated production schema).
  let plan: DailyPlan | null = null;
  try {
    plan = await buildDailyPlan(userProgress.userId, activeCourse.id, drizzlePlanRepo());
  } catch {
    try {
      plan = await buildDailyPlan(
        userProgress.userId,
        activeCourse.id,
        memoryPlanRepo(createMemoryStore())
      );
    } catch {
      plan = null;
    }
  }
  if (plan && plan.steps.length === 0) plan = null;

  // Dynamically generated curriculum tailored strictly to the selected language
  const defaultUnits: UnitItem[] = [
    {
      id: 1,
      order: 1,
      title: `Unit 1: ${lang} Basics & Nouns`,
      description: `Learn basic words, greetings, and common objects in ${lang}`,
      courseId: activeCourse.id,
      lessons: [
        { id: 1, title: `${lang} Nouns & Greetings`, unitId: 1, order: 1, completed: false },
        { id: 2, title: `${lang} Everyday Objects`, unitId: 1, order: 2, completed: false },
        { id: 3, title: `${lang} Expressions`, unitId: 1, order: 3, completed: false },
      ],
    },
    {
      id: 2,
      order: 2,
      title: `Unit 2: ${lang} Phrases & Numbers`,
      description: `Master numbers, questions, and daily phrases in ${lang}`,
      courseId: activeCourse.id,
      lessons: [
        { id: 4, title: `${lang} Numbers 1-10`, unitId: 2, order: 1, completed: false },
        { id: 5, title: `Asking Questions in ${lang}`, unitId: 2, order: 2, completed: false },
        { id: 6, title: `${lang} Food & Dining`, unitId: 2, order: 3, completed: false },
      ],
    },
    {
      id: 3,
      order: 3,
      title: `Unit 3: ${lang} Conversation Practice`,
      description: `Engage in interactive dialogues and grammar patterns in ${lang}`,
      courseId: activeCourse.id,
      lessons: [
        { id: 7, title: `${lang} Dialogue Practice`, unitId: 3, order: 1, completed: false },
        { id: 8, title: `${lang} Travel & Directions`, unitId: 3, order: 2, completed: false },
      ],
    },
  ];

  const dbUnits = await getUnits(activeCourse.id);
  
  // Use DB units if available and matching active course language, otherwise fallback to defaultUnits
  const units: UnitItem[] = (dbUnits && dbUnits.length > 0 && dbUnits[0].courseId === activeCourse.id && dbUnits[0].lessons.length > 0)
    ? (dbUnits as unknown as UnitItem[])
    : defaultUnits;

  // Find active lesson (first uncompleted lesson)
  let activeLesson: (LessonItem & { unit: UnitItem }) | undefined = undefined;
  for (const unit of units) {
    const uncompleted = unit.lessons.find((l) => !l.completed);
    if (uncompleted) {
      activeLesson = { ...uncompleted, unit };
      break;
    }
  }

  if (!activeLesson && units.length > 0 && units[0].lessons.length > 0) {
    activeLesson = { ...units[0].lessons[0], unit: units[0] };
  }

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
        <Header title={activeCourse.title} />
        {plan && (
          <TodaysPlan
            steps={plan.steps}
            estMinutes={plan.estMinutes}
            language={activeCourse.title}
          />
        )}
        {units.map((unit) => (
          <div key={unit.id} className="mb-10">
            <Unit
              id={unit.id}
              order={unit.order}
              title={unit.title}
              description={unit.description}
              lessons={unit.lessons}
              activeLesson={activeLesson}
              activeLessonPercentage={25}
              language={activeCourse.title}
            />
          </div>
        ))}
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;

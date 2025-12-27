import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "./user-progress";
import { getUnits, getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";

import { Header } from "./header";
import { Unit } from "./unit";

const LearnPage = async() => {

  const userProgressData = getUserProgress();
  const unitsData = getUnits();

  const [
    userProgress,
    units,
  ] = await Promise.all([
    userProgressData,
    unitsData,
  ]);

  if(!userProgress || !userProgress.activeCourse){
    redirect("/courses");
  }
  console.log("units:", units, typeof units, Array.isArray(units));

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">   
    <StickyWrapper>
    <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
          hasActiveSubscription={false}
        />
    </StickyWrapper>
    <FeedWrapper>
      <Header title={userProgress.activeCourse.title}/>
       {units.map((unit) => (
        <div key={unit.id} className="mb-10">
          <Unit
            id = {unit.id}
            order={unit.order}
            title={unit.title}
            description={unit.description}
            lessons={unit.lessons}
            activeLesson = {undefined}
            activeLessonPercentage = {0}
          />

        </div>
      ))} 
    </FeedWrapper>
    </div>   
  );
}

export default LearnPage;



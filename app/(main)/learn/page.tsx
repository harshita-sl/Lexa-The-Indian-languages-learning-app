import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Header } from "./header";
import { UserProgress } from "./user-progress";
import { getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";

const LearnPage = async() => {

  const userProgressData = getUserProgress();
  const [
    userProgress
  ] = await Promise.all([userProgressData
  ]);

  if(!userProgress || !userProgress.activeCourse){
    redirect("/courses");
  }
  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">   
    <StickyWrapper>
    <UserProgress
          activeCourse={{ title: "Telugu", imageSrc: "/tel.svg" }}
          hearts={5}
          points={100}
          hasActiveSubscription={false}
        />
    </StickyWrapper>
    <FeedWrapper>
      <Header title="Telugu"/>
      
    </FeedWrapper>
    </div>   
  );
}

export default LearnPage;



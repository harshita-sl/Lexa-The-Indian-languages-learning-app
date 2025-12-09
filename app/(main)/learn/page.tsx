import { StickyWrapper } from "@/components/sticky-wrapper";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Header } from "./header";
import { UserProgress } from "./user-progress";
const LearnPage = () => {
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



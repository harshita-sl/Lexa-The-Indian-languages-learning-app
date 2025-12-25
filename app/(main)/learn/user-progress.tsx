import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {InfinityIcon} from "lucide-react";
import { courses } from "@/db/schema";


type Props = {
    activeCourse: typeof courses.$inferSelect;
    hearts: number;
    points: number;
    hasActiveSubscription: boolean;
};  


export const UserProgress = ({
    activeCourse,
    points,
    hearts,
    hasActiveSubscription
 }: Props) => {
    return (
        <div className="flex item-center justify-between gap-x-2 w-full">
        <Link href="/courses">
        <Button variant="ghost">
        <Image
        src={activeCourse.imageSrc}
        alt={activeCourse.title}
        className="rounded-md border"
        width={32}
        height={32}
        />
        </Button>
        </Link>  
        <Link href="/shop">
        <Button variant="ghost" className="text-orange-400" >
        <Image src="/pointss.png" height={28} width={28} alt="Points" className="mr-2" />
        {points}
        </Button>
        </Link> 
        <Link href="/shop">
        <Button variant="ghost" className="text-rose-500" >
        <Image src="/heart.png" height={22} width={22} alt="Hearts" className="mr-2" />
        {hasActiveSubscription 
        ? <InfinityIcon className="h-4 w-4 stroke-[3]" />
         : hearts}
        {points}
        </Button>
        </Link> 
        
        </div>

    );
};
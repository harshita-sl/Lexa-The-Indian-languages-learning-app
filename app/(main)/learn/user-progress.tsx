import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Brain } from "lucide-react";
import { courses } from "@/db/schema";

type Props = {
    activeCourse: typeof courses.$inferSelect;
    hasActiveSubscription: boolean;
};

export const UserProgress = ({
    activeCourse,
}: Props) => {
    return (
        <div className="flex items-center justify-between gap-x-2 w-full">
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
            <Link href="/mastery">
                <Button variant="ghost" className="text-indigo-600">
                    <Brain className="h-5 w-5 mr-2" />
                    Mastery
                </Button>
            </Link>
            <Link href="/practice">
                <Button variant="ghost" className="text-emerald-600">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Practice
                </Button>
            </Link>
        </div>
    );
};
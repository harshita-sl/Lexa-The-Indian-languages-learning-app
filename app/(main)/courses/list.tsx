"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { userProgress, courses } from "@/db/schema";
import { upsertUserProgress } from "@/actions/user-progress";
import { Card } from "./card";

type Props = {
    courses: typeof courses.$inferSelect[];
    activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};

export const List = ({ courses, activeCourseId }: Props) => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const onClick = (id: number) => {
        if (pending) return;

        const targetCourse = courses.find((c) => c.id === id);
        const langTitle = targetCourse?.title || "Telugu";
        const targetUrl = `/learn?language=${encodeURIComponent(langTitle)}&courseId=${id}`;

        startTransition(async () => {
            try {
                await upsertUserProgress(id);
                router.push(targetUrl);
            } catch {
                router.push(targetUrl);
            }
        });
    };

    return (
        <div className="pt-6 grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    imageSrc={course.imageSrc}
                    onClick={onClick}
                    disabled={pending}
                    active={course.id === activeCourseId}
                />
            ))}
        </div>
    );
};
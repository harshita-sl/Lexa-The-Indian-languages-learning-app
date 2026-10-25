import {lessons, units } from "@/db/schema";
import { Unitbanner } from "./unit-banner";
import { LessonButton } from "./lesson-button";

type Props = {
    id: number;
    order: number;
    title: string;
    description: string;
    lessons: (typeof lessons.$inferSelect & { completed: boolean })[];
    activeLesson: typeof lessons.$inferSelect & {
        unit: typeof units.$inferSelect;
    } | undefined;
    activeLessonPercentage: number;
    language?: string;
};

export const Unit = ({
    title,
    description,
    lessons,
    activeLesson,
    activeLessonPercentage,
    language,
}: Props) => {
    return (
        <>
            <Unitbanner title={title} description={description} />
            <div className="flex items-center flex-col relative">
                {lessons.map((lesson, index) => {
                    const isCurrent = activeLesson ? lesson.id === activeLesson.id : index === 0;
                    const isLocked = !lesson.completed && !isCurrent;
                    return (
                        <LessonButton 
                            key={lesson.id}
                            id={lesson.id}
                            index={index}
                            totalCount={lessons.length - 1}
                            current={isCurrent}
                            locked={isLocked}
                            percentage={activeLessonPercentage}
                            language={language}
                            conceptId={lesson.conceptId}
                            title={lesson.title}
                        />
                    );
                })}
            </div>
        </>
    );
};
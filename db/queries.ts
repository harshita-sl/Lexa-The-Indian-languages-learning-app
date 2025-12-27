import { cache } from 'react';
import { auth } from "@clerk/nextjs/server";
import { eq } from 'drizzle-orm';
import { challengeProgress, courses, units, userProgress } from '@/db/schema';
import db from "@/db/drizzle"

export const getUserProgress = cache(async () => {
    // Placeholder for database query logic
    const { userId } = await auth();

    if(!userId){
        return null;
    }
    
    const data = await db.query.userProgress.findFirst({ 
        where: eq(userProgress.userId, userId),
        with: {
            activeCourse: true,
        },
    });
    return data;
});

export const getUnits = cache(async (courseId: number) => {
    const { userId } = await auth();  
    const userProgress = await getUserProgress();


    if(!userId || !userProgress?.activeCourseId){
        return [];
    }
    const data = await db.query.units.findMany({
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                with: {
                    challenges: {
                        with: {
                            challengeProgress: {
                                where: eq(challengeProgress.userId, userId),
                            }
                        },
                    },   
                },
            },
        },
    });
    const NormalizedData = data.map((unit) => {
        const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
            const allCompletedChallenges = lesson.challenges.every((challenge) => {
            return challenge.challengeProgress && challenge.challengeProgress.length > 0 && challenge.challengeProgress.every((progress) => progress.completed);
            });
            return {
                ...lesson,
                completed: allCompletedChallenges,
            };
        });
        return {
            ...unit,
            lessons: lessonsWithCompletedStatus,
        };
    });
    return NormalizedData;
});

export const getCourses = cache(async () => {   
    // Placeholder for database query logic
    const data = await db.query.courses.findMany();
    return data;
});   

export const getCourseById = cache(async (courseId: number) => {
    const data = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
    });
    return data;
});

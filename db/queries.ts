import { cache } from 'react';
import { auth } from "@clerk/nextjs/server";
import { eq, and, lte, desc } from 'drizzle-orm';
import {
    challengeProgress,
    courses,
    units,
    userProgress,
    userPreferences,
    learnerKnowledgeNodes,
    learnerSessions,
    learnerSkillState,
} from '@/db/schema';
import db from "@/db/drizzle";

export const getUserProgress = cache(async () => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const data = await db.query.userProgress.findFirst({
            where: eq(userProgress.userId, effectiveUserId),
        });
        if (data) return data;
    } catch (e) {
        console.error("Failed to fetch user progress from DB:", e);
    }

    return {
        userId: effectiveUserId,
        userName: "Learner",
        userImageSrc: "/mascot.svg",
        activeCourseId: 1, // Default Telugu
        completedChallenges: 0,
        accuracyRate: 1.0,
        lastActiveAt: new Date(),
    };
});

export const getUnits = cache(async (courseId: number) => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const data = await db.query.units.findMany({
            where: eq(units.courseId, courseId),
            with: {
                lessons: {
                    with: {
                        challenges: {
                            with: {
                                challengeProgress: {
                                    where: eq(challengeProgress.userId, effectiveUserId),
                                },
                            },
                        },
                    },
                },
            },
        });
        if (data && data.length > 0) return data;
    } catch (e) {
        console.error("Failed to fetch units from DB:", e);
    }

    return [];
});

export const getCourses = cache(async () => {
    try {
        const data = await db.query.courses.findMany();
        if (data && data.length > 0) return data;
    } catch (e) {
        console.error("Failed to fetch courses from DB:", e);
    }

    return [
        { id: 1, title: "Telugu", imageSrc: "/tel.svg" },
        { id: 2, title: "Hindi", imageSrc: "/hindi.svg" },
        { id: 3, title: "Kannada", imageSrc: "/kan.svg" },
    ];
});

export const getCourseById = cache(async (courseId: number) => {
    try {
        const data = await db.query.courses.findFirst({
            where: eq(courses.id, courseId),
        });
        if (data) return data;
    } catch (e) {
        console.error("Failed to fetch course by ID:", e);
    }

    const fallbackCourses: Record<number, { id: number; title: string; imageSrc: string }> = {
        1: { id: 1, title: "Telugu", imageSrc: "/tel.svg" },
        2: { id: 2, title: "Hindi", imageSrc: "/hindi.svg" },
        3: { id: 3, title: "Kannada", imageSrc: "/kan.svg" },
    };

    return fallbackCourses[courseId] || fallbackCourses[1];
});

export const getUserPreferences = cache(async () => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const data = await db.query.userPreferences.findFirst({
            where: eq(userPreferences.userId, effectiveUserId),
        });
        if (data) return data;
    } catch (e) {
        console.error("Failed to fetch user preferences:", e);
    }

    return {
        userId: effectiveUserId,
        learningStyle: 'balanced',
        difficulty: 'adaptive',
        dailyGoalMinutes: 15,
        preferredTopics: [],
        nativeLanguage: 'English',
        currentLevel: 'beginner',
        targetRegister: 'colloquial',
        transliterationMode: 'both',
        assessmentCompleted: true,
        updatedAt: new Date(),
    };
});

// FSRS Knowledge Nodes Queries
export const getLearnerKnowledgeNodes = cache(async (courseId?: number) => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const conditions = [eq(learnerKnowledgeNodes.userId, effectiveUserId)];
        if (courseId) {
            conditions.push(eq(learnerKnowledgeNodes.courseId, courseId));
        }

        const data = await db.query.learnerKnowledgeNodes.findMany({
            where: and(...conditions),
        });
        return data || [];
    } catch (e) {
        console.error("Failed to fetch learner knowledge nodes:", e);
        return [];
    }
});

export const getDueReviewNodes = cache(async (courseId?: number) => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";
    const now = new Date();

    try {
        const conditions = [
            eq(learnerKnowledgeNodes.userId, effectiveUserId),
            lte(learnerKnowledgeNodes.dueAt, now)
        ];
        if (courseId) {
            conditions.push(eq(learnerKnowledgeNodes.courseId, courseId));
        }

        const data = await db.query.learnerKnowledgeNodes.findMany({
            where: and(...conditions),
        });
        return data || [];
    } catch (e) {
        console.error("Failed to fetch due review nodes:", e);
        return [];
    }
});

// Per-skill ability + BKT state (Elo & mastery bars on /mastery)
export const getLearnerSkillStates = cache(async (courseId?: number) => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const conditions = [eq(learnerSkillState.userId, effectiveUserId)];
        if (courseId) {
            conditions.push(eq(learnerSkillState.courseId, courseId));
        }
        const data = await db.query.learnerSkillState.findMany({
            where: and(...conditions),
        });
        return data || [];
    } catch (e) {
        console.error("Failed to fetch skill states:", e);
        return [];
    }
});

// Weak-area histogram: error-dimension counts over recent sessions
export const getWeakAreas = cache(async (limitCount = 40) => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const rows = await db.query.learnerSessions.findMany({
            where: eq(learnerSessions.userId, effectiveUserId),
            orderBy: [desc(learnerSessions.createdAt)],
            limit: limitCount,
        });
        const counts = new Map<string, number>();
        for (const r of rows) {
            const d = r.errorClassification;
            if (d && d !== "none") counts.set(d, (counts.get(d) ?? 0) + 1);
        }
        return [...counts.entries()]
            .map(([dimension, count]) => ({ dimension, count }))
            .sort((a, b) => b.count - a.count);
    } catch (e) {
        console.error("Failed to fetch weak areas:", e);
        return [];
    }
});

// Recent Diagnostic Sessions
export const getRecentLearnerSessions = cache(async (limitCount = 20) => {
    const { userId } = await auth();
    const effectiveUserId = userId || "guest_demo_user";

    try {
        const data = await db.query.learnerSessions.findMany({
            where: eq(learnerSessions.userId, effectiveUserId),
            orderBy: [desc(learnerSessions.createdAt)],
            limit: limitCount,
        });
        return data || [];
    } catch (e) {
        console.error("Failed to fetch recent learner sessions:", e);
        return [];
    }
});

"use server";
import { redirect } from "next/navigation";
import { getCourseById, getUserProgress } from "@/db/queries";
import { auth, currentUser } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const upsertUserProgress = async (courseId: number) => {
    const { userId } = await auth();
    const user = await currentUser();

    const effectiveUserId = userId || "guest_demo_user";
    const userName = user?.firstName || "Learner";
    const userImageSrc = user?.imageUrl || "/mascot.svg";

    const course = await getCourseById(courseId);
    if (!course) {
        throw new Error("Course not found");
    }

    try {
        const existingUserProgress = await getUserProgress();
        if (existingUserProgress) {
            await db.update(userProgress).set({
                activeCourseId: courseId,
                userName: userName,
                userImageSrc: userImageSrc,
                lastActiveAt: new Date(),
            }).where(eq(userProgress.userId, effectiveUserId));

            revalidatePath("/learn");
            revalidatePath("/courses");
            redirect("/learn");
        }

        await db.insert(userProgress).values({
            userId: effectiveUserId,
            userName: userName,
            userImageSrc: userImageSrc,
            activeCourseId: courseId,
            completedChallenges: 0,
            accuracyRate: 1.0,
            lastActiveAt: new Date(),
        });
    } catch (e) {
        console.error("User progress update note:", e);
    }

    revalidatePath("/learn");
    revalidatePath("/courses");
    redirect("/learn");
};

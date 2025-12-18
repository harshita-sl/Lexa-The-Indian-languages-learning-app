"use server";
import { redirect } from "next/navigation";
import { getCourseById } from "@/db/queries";
import { getUserProgress } from "@/db/queries";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import { courses, userProgress } from "@/db/schema";
import { revalidatePath } from "next/cache";

export const upsertUserProgress = async (courseId: number) => {
    const { userId } = await auth();
    const user = await currentUser();

    if(!userId || !user) {
        throw new Error("User not authenticated");
    }

    const course = await getCourseById(courseId);
    if(!course) {
        throw new Error("Course not found");
    }
    // if(!course.units.length || !course.units[0].lessons.length) {
    //     throw new Error("Course has no content");
    // }

    const existingUserProgress = await getUserProgress();
    if(existingUserProgress) {
        await db.update(userProgress).set({
            activeCourseId: courseId,
            userName: user.firstName || "User",
            userImageSrc: user.imageUrl || "/mascot.svg",
        })
    revalidatePath("/learn");
    revalidatePath("/courses");
    redirect("/learn");
    }
    await db.insert(userProgress).values({
        userId: userId,
        userName: user.firstName || "User",
        userImageSrc: user.imageUrl || "/mascot.svg",
        activeCourseId: courseId,
    });
    revalidatePath("/learn");
    revalidatePath("/courses");
    redirect("/learn");

}

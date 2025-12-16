import { pgTable , serial, text} from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    imageSrc: text("image_src").notNull(),
}) 

export const userProgress = pgTable("user_progress", {
    id: serial("id").primaryKey(),
    userId: serial("user_id").notNull(),
    courseId: serial("course_id").notNull(),
    progress: text("progress").notNull(),
});
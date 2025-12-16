import { cache } from 'react';
import db from "@/db/drizzle"
export const getCourses = cache(async () => {
    // Placeholder for database query logic
    const data = await db.query.courses.findMany();
    return data;
});   

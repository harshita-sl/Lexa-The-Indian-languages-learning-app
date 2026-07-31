# Lexa — The Indian Languages Learning App

A Duolingo-style web app for learning Indian languages (Telugu, Hindi, Kannada,
Sanskrit), built with Next.js. Users pick a course, work through units and
lessons made of multiple-choice challenges, and track progress via hearts and
points.

## Tech stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) components (Radix primitives)
- **Auth:** [Clerk](https://clerk.com/) — sign-up/sign-in, session management, user profile
- **Database:** [Neon](https://neon.tech/) serverless Postgres + [Drizzle ORM](https://orm.drizzle.team/)
- **Other:** `react-circular-progressbar`, `sonner` (toasts), `lucide-react` (icons)

## Features

- Course selection (Telugu, Hindi, Kannada, Sanskrit)
- Units → lessons → challenges (SELECT / ASSIST question types)
- Per-user progress tracking: active course, hearts, points, completed challenges
- Clerk-authenticated sessions gate all progress data

## Project structure

```
app/
  (marketing)/    landing page, header, footer
  (main)/
    courses/      course selection
    learn/        lesson map, unit/lesson UI, user progress sidebar
db/
  schema.ts       Drizzle table definitions (courses, units, lessons, challenges, ...)
  queries.ts      cached read queries (getUserProgress, getUnits, getCourses, ...)
  drizzle.ts      Neon connection + Drizzle client
actions/          server actions (e.g. upsertUserProgress)
components/       shared UI (sidebar, headers, shadcn/ui primitives)
scripts/seed.ts   seeds the database with sample courses/units/lessons
middleware.ts     Clerk middleware (attaches session to every request)
```

## Getting started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com/) application (for the publishable + secret key)
- A [Neon](https://neon.tech/) Postgres database (for the connection string)

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/harshita-sl/Lexa-The-Indian-languages-learning-app.git
   cd Lexa-The-Indian-languages-learning-app
   npm install
   ```

2. Create a `.env.local` file in the project root:

   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=your_neon_postgres_connection_string
   ```

3. Push the schema to your database and seed it with sample data:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Script            | Description                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Next.js dev server                  |
| `npm run build`   | Production build                              |
| `npm run start`   | Start the production server                   |
| `npm run lint`    | Run ESLint                                    |
| `npm run db:push` | Push the Drizzle schema to the database       |
| `npm run db:seed` | Seed the database with sample courses/lessons |
| `npm run db:studio` | Open Drizzle Studio to browse the database  |

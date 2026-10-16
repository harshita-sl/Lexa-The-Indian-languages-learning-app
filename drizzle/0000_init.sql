CREATE TYPE "public"."type" AS ENUM('SELECT', 'ASSIST', 'TRANSLATE', 'SPEAK', 'LISTEN', 'CONVERSATION', 'MATCH', 'ORDER');--> statement-breakpoint
CREATE TABLE "ai_generated_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"input_hash" text NOT NULL,
	"content" jsonb NOT NULL,
	"language" text NOT NULL,
	"topic" text,
	"difficulty" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "challenge_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"text" text NOT NULL,
	"correct" boolean NOT NULL,
	"image_src" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE "challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"type" "type" NOT NULL,
	"question" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"language" text NOT NULL,
	"messages" jsonb NOT NULL,
	"context" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_src" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_knowledge_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"concept_id" text NOT NULL,
	"concept_type" text DEFAULT 'vocabulary' NOT NULL,
	"stability" real DEFAULT 1 NOT NULL,
	"difficulty" real DEFAULT 5 NOT NULL,
	"retrievability" real DEFAULT 1 NOT NULL,
	"last_reviewed_at" timestamp DEFAULT now(),
	"due_at" timestamp DEFAULT now(),
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" text DEFAULT 'learning' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"challenge_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"error_classification" text DEFAULT 'none',
	"acoustic_phonetic_score" real,
	"explanation" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"unit_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"learning_style" text DEFAULT 'balanced',
	"difficulty" text DEFAULT 'adaptive',
	"daily_goal_minutes" integer DEFAULT 15,
	"preferred_topics" text[] DEFAULT '{}',
	"native_language" text DEFAULT 'English',
	"current_level" text DEFAULT 'beginner',
	"target_register" text DEFAULT 'colloquial',
	"transliteration_mode" text DEFAULT 'both',
	"assessment_completed" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_name" text DEFAULT 'Learner' NOT NULL,
	"user_image_src" text DEFAULT '/mascot.svg' NOT NULL,
	"active_course_id" integer,
	"completed_challenges" integer DEFAULT 0 NOT NULL,
	"accuracy_rate" real DEFAULT 1 NOT NULL,
	"last_active_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "challenge_options" ADD CONSTRAINT "challenge_options_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_knowledge_nodes" ADD CONSTRAINT "learner_knowledge_nodes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_sessions" ADD CONSTRAINT "learner_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_active_course_id_courses_id_fk" FOREIGN KEY ("active_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_content_type_hash_idx" ON "ai_generated_content" USING btree ("content_type","input_hash");
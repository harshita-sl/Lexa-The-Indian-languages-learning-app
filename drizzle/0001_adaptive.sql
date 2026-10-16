CREATE TABLE "learner_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"item_key" text NOT NULL,
	"concept_id" text NOT NULL,
	"item_type" text DEFAULT 'word' NOT NULL,
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
CREATE TABLE "learner_skill_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"skill" text NOT NULL,
	"elo" real DEFAULT 1000 NOT NULL,
	"bkt_known" real DEFAULT 0.2 NOT NULL,
	"bkt_learn" real DEFAULT 0.15 NOT NULL,
	"bkt_guess" real DEFAULT 0.22 NOT NULL,
	"bkt_slip" real DEFAULT 0.1 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"concept_id" text NOT NULL,
	"skill" text DEFAULT 'vocabulary' NOT NULL,
	"type" text DEFAULT 'SELECT' NOT NULL,
	"payload" jsonb NOT NULL,
	"difficulty_b" real DEFAULT 0 NOT NULL,
	"review_status" text DEFAULT 'seeded' NOT NULL,
	"source" text DEFAULT 'seed' NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendation_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"task_type" text NOT NULL,
	"concept_id" text,
	"item_key" text,
	"reason" text NOT NULL,
	"scores" jsonb,
	"served_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "spoken_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"kind" text DEFAULT 'slang' NOT NULL,
	"native_text" text NOT NULL,
	"translit" text,
	"gloss" text NOT NULL,
	"register" text DEFAULT 'casual' NOT NULL,
	"region" text,
	"example" jsonb,
	"concept_id" text,
	"review_status" text DEFAULT 'unreviewed' NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_generated_content" ADD COLUMN "review_status" text DEFAULT 'unreviewed' NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "concept_id" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "skill" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "item_difficulty" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "review_status" text DEFAULT 'seeded' NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "source" text DEFAULT 'seed' NOT NULL;--> statement-breakpoint
ALTER TABLE "learner_sessions" ADD COLUMN "item_id" text;--> statement-breakpoint
ALTER TABLE "learner_sessions" ADD COLUMN "skill" text;--> statement-breakpoint
ALTER TABLE "learner_sessions" ADD COLUMN "source" text DEFAULT 'lesson' NOT NULL;--> statement-breakpoint
ALTER TABLE "learner_sessions" ADD COLUMN "task_reason" text;--> statement-breakpoint
ALTER TABLE "learner_sessions" ADD COLUMN "hints_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "target_language" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "goal" text DEFAULT 'culture';--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "learner_items" ADD CONSTRAINT "learner_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_skill_state" ADD CONSTRAINT "learner_skill_state_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_log" ADD CONSTRAINT "recommendation_log_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "li_user_item_idx" ON "learner_items" USING btree ("user_id","item_key");--> statement-breakpoint
CREATE UNIQUE INDEX "lss_user_skill_idx" ON "learner_skill_state" USING btree ("user_id","course_id","skill");--> statement-breakpoint
CREATE UNIQUE INDEX "pi_lang_concept_hash_idx" ON "practice_items" USING btree ("language","concept_id","content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "sc_lang_hash_idx" ON "spoken_content" USING btree ("language","content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "lkn_user_concept_idx" ON "learner_knowledge_nodes" USING btree ("user_id","course_id","concept_id");
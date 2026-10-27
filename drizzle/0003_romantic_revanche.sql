CREATE TABLE "tts_audio_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_hash" text NOT NULL,
	"language" text NOT NULL,
	"content_type" text DEFAULT 'audio/wav' NOT NULL,
	"audio_b64" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tac_key_hash_idx" ON "tts_audio_cache" USING btree ("key_hash");
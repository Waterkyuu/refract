CREATE TABLE IF NOT EXISTS "learn_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "learn_memories_type_updated_at_idx"
ON "learn_memories" ("type", "updated_at");

CREATE UNIQUE INDEX IF NOT EXISTS "learn_memories_type_title_idx"
ON "learn_memories" ("type", "title");

CREATE TABLE IF NOT EXISTS "verse_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference" varchar(120) NOT NULL,
	"book_id" varchar(60),
	"chapter" integer,
	"verse" integer,
	"title" varchar(200),
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cross_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_ref" varchar(60) NOT NULL,
	"to_ref" varchar(60) NOT NULL,
	"votes" integer DEFAULT 0
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verse_notes" ADD CONSTRAINT "verse_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_notes_user_ref_idx" ON "verse_notes" ("user_id","reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cross_references_from_idx" ON "cross_references" ("from_ref");

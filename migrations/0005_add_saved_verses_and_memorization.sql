CREATE TABLE IF NOT EXISTS "memorization_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference" varchar(120) NOT NULL,
	"verse_text" text NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_date" varchar(10) NOT NULL,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_verses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference" varchar(120) NOT NULL,
	"verses" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memorization_cards" ADD CONSTRAINT "memorization_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_verses" ADD CONSTRAINT "saved_verses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memorization_cards_user_ref_idx" ON "memorization_cards" USING btree ("user_id","reference");--> statement-breakpoint
CREATE INDEX "memorization_cards_user_due_idx" ON "memorization_cards" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_verses_user_ref_idx" ON "saved_verses" USING btree ("user_id","reference");
CREATE TABLE IF NOT EXISTS "weekly_recaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_key" varchar(10) NOT NULL,
	"summary" text NOT NULL,
	"stats" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_recaps" ADD CONSTRAINT "weekly_recaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_recaps_user_week_idx" ON "weekly_recaps" USING btree ("user_id","week_key");
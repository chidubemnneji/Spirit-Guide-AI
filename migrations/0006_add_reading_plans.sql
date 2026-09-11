CREATE TABLE IF NOT EXISTS "user_reading_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" varchar(60) NOT NULL,
	"completed_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp,
	"last_read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user_reading_plans" ADD CONSTRAINT "user_reading_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_reading_plans_user_plan_idx" ON "user_reading_plans" USING btree ("user_id","plan_id");
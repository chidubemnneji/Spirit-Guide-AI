CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"anon_label" varchar(100) NOT NULL,
	"prayer_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_prayers" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"conversation_id" integer,
	"key_topics" text[],
	"emotional_patterns" text[],
	"struggles" text[],
	"growth_moments" text[],
	"recurring_questions" text[],
	"faith_stage_indicators" varchar(50),
	"summary" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"topic" varchar(100) NOT NULL,
	"first_mentioned" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_mentioned" timestamp DEFAULT CURRENT_TIMESTAMP,
	"mention_count" integer DEFAULT 1,
	"sentiment" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"persona_id" integer,
	"title" text DEFAULT 'New Conversation',
	"channel" varchar(50) DEFAULT 'general',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"crisis_level" varchar(20) NOT NULL,
	"indicators" text[],
	"message_excerpt" text,
	"reviewed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_devotional_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"devotional_id" integer,
	"assigned_date" varchar(10) NOT NULL,
	"is_completed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devotional_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_completed_date" varchar(10),
	"total_devotionals_completed" integer DEFAULT 0,
	"streak_milestones_achieved" text[],
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "devotionals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"subtitle" varchar(300),
	"scripture_reference" varchar(100) NOT NULL,
	"scripture_text" text NOT NULL,
	"opening_hook" text NOT NULL,
	"reflection_content" text NOT NULL,
	"todays_practice" text NOT NULL,
	"closing_prayer" text NOT NULL,
	"themes" text[],
	"estimated_read_time" integer DEFAULT 5,
	"generated_for_user_id" integer,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotional_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"emotional_state" varchar(50) NOT NULL,
	"intensity" integer,
	"context" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memorable_moments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"conversation_id" integer,
	"moment_type" varchar(50),
	"summary" text,
	"emotional_state" varchar(50),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mode_transitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"persona_id" integer,
	"from_mode" varchar(20) NOT NULL,
	"to_mode" varchar(20) NOT NULL,
	"trigger" varchar(50) NOT NULL,
	"user_consented" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"is_read" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200),
	"content" text NOT NULL,
	"mood" varchar(50),
	"tags" text[],
	"verse_reference" varchar(100),
	"verse_text" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "recommendation_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"message_id" integer,
	"practice_type" varchar(100),
	"title" varchar(200) NOT NULL,
	"description" text,
	"duration" varchar(50),
	"instructions" text,
	"icon_emoji" varchar(10),
	"clicked" integer DEFAULT 0,
	"clicked_at" timestamp,
	"completed" integer DEFAULT 0,
	"helpful_rating" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shame_detections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"persona_id" integer,
	"message_id" integer,
	"shame_level" varchar(20) NOT NULL,
	"shame_types" text[],
	"triggers" text[],
	"reframe_given" text,
	"reframe_accepted" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"persona_id" integer,
	"event_type" varchar(50) NOT NULL,
	"weight" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_devotional_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"devotional_id" integer NOT NULL,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"completed_at" timestamp,
	"time_spent_seconds" integer,
	"listened_to_audio" integer DEFAULT 0,
	"reflected_with_ai" integer DEFAULT 0,
	"rating" integer,
	"is_bookmarked" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_personas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"primary_struggle" varchar(100),
	"depth_layer_responses" jsonb,
	"daily_rhythm" text[],
	"past_connection_moment" varchar(100),
	"connection_recency" varchar(50),
	"peak_energy_time" varchar(50),
	"obstacles" text[],
	"transformation_goals" text[],
	"primary_persona" varchar(50),
	"persona_modifiers" text[],
	"grace_archetype" varchar(50),
	"grace_trust" jsonb,
	"grace_mode" varchar(20),
	"grace_evolution" jsonb,
	"grace_behavioral_signals" jsonb,
	"grace_content_profile" jsonb,
	"grace_safety_profile" jsonb,
	"grace_sensitivity" jsonb,
	"grace_tradition" jsonb,
	"grace_scores" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"has_completed_onboarding" integer DEFAULT 0,
	"email_verified" integer DEFAULT 0,
	"verification_token" varchar(255),
	"verification_token_expiry" timestamp,
	"google_id" varchar(255),
	"is_beta_user" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_active" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_prayers" ADD CONSTRAINT "community_prayers_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_prayers" ADD CONSTRAINT "community_prayers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_memories" ADD CONSTRAINT "conversation_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_memories" ADD CONSTRAINT "conversation_memories_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_topics" ADD CONSTRAINT "conversation_topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crisis_alerts" ADD CONSTRAINT "crisis_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_devotional_assignments" ADD CONSTRAINT "daily_devotional_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_devotional_assignments" ADD CONSTRAINT "daily_devotional_assignments_devotional_id_devotionals_id_fk" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotional_streaks" ADD CONSTRAINT "devotional_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotionals" ADD CONSTRAINT "devotionals_generated_for_user_id_users_id_fk" FOREIGN KEY ("generated_for_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotional_checkins" ADD CONSTRAINT "emotional_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorable_moments" ADD CONSTRAINT "memorable_moments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorable_moments" ADD CONSTRAINT "memorable_moments_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mode_transitions" ADD CONSTRAINT "mode_transitions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mode_transitions" ADD CONSTRAINT "mode_transitions_persona_id_user_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."user_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_journal_entries" ADD CONSTRAINT "prayer_journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_cards" ADD CONSTRAINT "recommendation_cards_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_cards" ADD CONSTRAINT "recommendation_cards_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shame_detections" ADD CONSTRAINT "shame_detections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shame_detections" ADD CONSTRAINT "shame_detections_persona_id_user_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."user_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shame_detections" ADD CONSTRAINT "shame_detections_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_events" ADD CONSTRAINT "trust_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_events" ADD CONSTRAINT "trust_events_persona_id_user_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."user_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devotional_progress" ADD CONSTRAINT "user_devotional_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devotional_progress" ADD CONSTRAINT "user_devotional_progress_devotional_id_devotionals_id_fk" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_personas" ADD CONSTRAINT "user_personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_user_id_idx" ON "community_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_posts_created_at_idx" ON "community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "community_prayers_unique_idx" ON "community_prayers" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_channel_idx" ON "conversations" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "conversations_created_at_idx" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "journal_user_id_idx" ON "prayer_journal_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "journal_user_created_idx" ON "prayer_journal_entries" USING btree ("user_id","created_at");
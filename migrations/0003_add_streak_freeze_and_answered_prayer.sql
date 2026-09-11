-- NOTE: drizzle-kit's tracked snapshot is stale as of 0002 (that migration was
-- hand-applied without regenerating the snapshot, same as its own comment
-- explains), so a fresh `generate` re-diffs against 0001 and re-emits
-- CREATE TABLE for cross_references/verse_notes here. Both already exist in
-- production via 0002 — stripped below, and every statement here uses an
-- IF NOT EXISTS / IF EXISTS guard so this migration is safe to run even if
-- the drift is ever different than expected.
ALTER TABLE "devotional_streaks" ADD COLUMN IF NOT EXISTS "freezes_available" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "devotional_streaks" ADD COLUMN IF NOT EXISTS "freeze_refill_month" varchar(7);--> statement-breakpoint
ALTER TABLE "devotional_streaks" ADD COLUMN IF NOT EXISTS "last_freeze_used_date" varchar(10);--> statement-breakpoint
ALTER TABLE "prayer_journal_entries" ADD COLUMN IF NOT EXISTS "answered_at" timestamp;--> statement-breakpoint
ALTER TABLE "prayer_journal_entries" ADD COLUMN IF NOT EXISTS "answer_note" text;

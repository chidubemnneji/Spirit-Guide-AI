import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  hasCompletedOnboarding: integer("has_completed_onboarding").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastActive: timestamp("last_active").default(sql`CURRENT_TIMESTAMP`),
});

// User Personas table
export const userPersonas = pgTable("user_personas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Phase 1: Emotional Entry
  primaryStruggle: varchar("primary_struggle", { length: 100 }),
  
  // Phase 2: Depth Layer (JSON for flexibility)
  depthLayerResponses: jsonb("depth_layer_responses"),
  
  // Phase 3: Behavioral Reality
  dailyRhythm: text("daily_rhythm").array(),
  pastConnectionMoment: varchar("past_connection_moment", { length: 100 }),
  connectionRecency: varchar("connection_recency", { length: 50 }),
  peakEnergyTime: varchar("peak_energy_time", { length: 50 }),
  obstacles: text("obstacles").array(),
  
  // Phase 4: Hope Layer
  transformationGoals: text("transformation_goals").array(),
  
  // Generated Persona (legacy)
  primaryPersona: varchar("primary_persona", { length: 50 }),
  personaModifiers: text("persona_modifiers").array(),
  
  // GRACE Persona System v2.0
  graceArchetype: varchar("grace_archetype", { length: 50 }), // wounded_seeker, eager_builder, etc.
  graceTrust: jsonb("grace_trust"), // TrustProfile: level, score, earnedThrough
  graceMode: varchar("grace_mode", { length: 20 }), // support, formation, learning
  graceEvolution: jsonb("grace_evolution"), // EvolutionState: phase, trajectory, daysInApp
  graceBehavioralSignals: jsonb("grace_behavioral_signals"), // BehavioralSignals
  graceContentProfile: jsonb("grace_content_profile"), // ContentProfile: scriptureBias, terminology
  graceSafetyProfile: jsonb("grace_safety_profile"), // SafetyProfile: crisisWatch, shameDetected
  graceSensitivity: jsonb("grace_sensitivity"), // SensitivityMap: topics, triggers
  graceTradition: jsonb("grace_tradition"), // TraditionProfile: declared, relationship
  graceScores: jsonb("grace_scores"), // PersonaScores: vulnerability, emotionalCapacity, etc.
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  personaId: integer("persona_id"),
  title: text("title").default("New Conversation"),
  channel: varchar("channel", { length: 50 }).default("general"), // general | devotional | checkin
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Conversation Topics - for memory across conversations
export const conversationTopics = pgTable("conversation_topics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 100 }).notNull(),
  firstMentioned: timestamp("first_mentioned").default(sql`CURRENT_TIMESTAMP`),
  lastMentioned: timestamp("last_mentioned").default(sql`CURRENT_TIMESTAMP`),
  mentionCount: integer("mention_count").default(1),
  sentiment: varchar("sentiment", { length: 50 }), // "struggling", "improving", "resolved"
});

// Emotional Check-ins
export const emotionalCheckins = pgTable("emotional_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  emotionalState: varchar("emotional_state", { length: 50 }).notNull(),
  intensity: integer("intensity"), // 1-10
  context: text("context"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Crisis Alerts
export const crisisAlerts = pgTable("crisis_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  crisisLevel: varchar("crisis_level", { length: 20 }).notNull(), // "none", "concern", "moderate", "high", "immediate"
  indicators: text("indicators").array(),
  messageExcerpt: text("message_excerpt"),
  reviewed: integer("reviewed").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Memorable Moments
export const memorableMoments = pgTable("memorable_moments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").references(() => conversations.id),
  momentType: varchar("moment_type", { length: 50 }), // "breakthrough", "insight", "commitment"
  summary: text("summary"),
  emotionalState: varchar("emotional_state", { length: 50 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Recommendation Cards - Interactive practice suggestions
export const recommendationCards = pgTable("recommendation_cards", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => messages.id),
  practiceType: varchar("practice_type", { length: 100 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  duration: varchar("duration", { length: 50 }),
  instructions: text("instructions"),
  iconEmoji: varchar("icon_emoji", { length: 10 }),
  clicked: integer("clicked").default(0),
  clickedAt: timestamp("clicked_at"),
  completed: integer("completed").default(0),
  helpfulRating: integer("helpful_rating"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trust Events - Logs trust-building interactions
export const trustEvents = pgTable("trust_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  personaId: integer("persona_id").references(() => userPersonas.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  weight: integer("weight").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Shame Detections - Logs shame patterns detected and reframes given
export const shameDetections = pgTable("shame_detections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  personaId: integer("persona_id").references(() => userPersonas.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => messages.id, { onDelete: "set null" }),
  shameLevel: varchar("shame_level", { length: 20 }).notNull(),
  shameTypes: text("shame_types").array(),
  triggers: text("triggers").array(),
  reframeGiven: text("reframe_given"),
  reframeAccepted: integer("reframe_accepted"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Mode Transitions - Logs when users change modes
export const modeTransitions = pgTable("mode_transitions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  personaId: integer("persona_id").references(() => userPersonas.id, { onDelete: "cascade" }),
  fromMode: varchar("from_mode", { length: 20 }).notNull(),
  toMode: varchar("to_mode", { length: 20 }).notNull(),
  trigger: varchar("trigger", { length: 50 }).notNull(),
  userConsented: integer("user_consented").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  hasCompletedOnboarding: true,
});

// Password validation rules - exported for frontend use
export const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

// Auth schemas
export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export const insertUserPersonaSchema = createInsertSchema(userPersonas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationCardSchema = createInsertSchema(recommendationCards).omit({
  id: true,
  createdAt: true,
  clicked: true,
  clickedAt: true,
  completed: true,
  helpfulRating: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserPersona = z.infer<typeof insertUserPersonaSchema>;
export type UserPersona = typeof userPersonas.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertRecommendationCard = z.infer<typeof insertRecommendationCardSchema>;
export type RecommendationCard = typeof recommendationCards.$inferSelect;

// New types for AI intelligence features
export type ConversationTopic = typeof conversationTopics.$inferSelect;
export type EmotionalCheckin = typeof emotionalCheckins.$inferSelect;
export type CrisisAlert = typeof crisisAlerts.$inferSelect;
export type MemorableMoment = typeof memorableMoments.$inferSelect;

// Emotional state detection result
export interface EmotionalState {
  primaryEmotion: string;
  intensity: number;
  urgency: "low" | "medium" | "high" | "crisis";
  needs: string[];
  toneRecommendation: string;
}

// Crisis assessment result
export interface CrisisAssessment {
  crisisLevel: "none" | "concern" | "moderate" | "high" | "immediate";
  indicators: string[];
  immediateActionNeeded: boolean;
  recommendedResponse: string;
}

// Onboarding data type for frontend
export interface OnboardingData {
  userName: string | null;
  tradition: string | null;
  primaryStruggle: string | null;
  depthLayer: Record<string, unknown> | null;
  behavioralReality: {
    dailyRhythm: string[];
    pastConnectionMoment: string | null;
    connectionRecency: string | null;
    peakEnergyTime: string | null;
    obstacles: string[];
  } | null;
  transformationGoals: string[];
}

// Persona types
export type PersonaType = 
  | 'seeker_in_void'
  | 'doubter_in_crisis'
  | 'isolated_wanderer'
  | 'guilt_ridden_striver'
  | 'overwhelmed_survivor'
  | 'hungry_beginner'
  | 'momentum_breaker'
  | 'comparison_captive';

// Devotionals table
export const devotionals = pgTable("devotionals", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: varchar("subtitle", { length: 300 }),
  scriptureReference: varchar("scripture_reference", { length: 100 }).notNull(),
  scriptureText: text("scripture_text").notNull(),
  openingHook: text("opening_hook").notNull(),
  reflectionContent: text("reflection_content").notNull(),
  todaysPractice: text("todays_practice").notNull(),
  closingPrayer: text("closing_prayer").notNull(),
  themes: text("themes").array(),
  estimatedReadTime: integer("estimated_read_time").default(5),
  generatedForUserId: integer("generated_for_user_id").references(() => users.id),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// User devotional progress
export const userDevotionalProgress = pgTable("user_devotional_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  devotionalId: integer("devotional_id").references(() => devotionals.id, { onDelete: "cascade" }).notNull(),
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`),
  completedAt: timestamp("completed_at"),
  timeSpentSeconds: integer("time_spent_seconds"),
  listenedToAudio: integer("listened_to_audio").default(0),
  reflectedWithAi: integer("reflected_with_ai").default(0),
  rating: integer("rating"),
  isBookmarked: integer("is_bookmarked").default(0),
});

// Daily devotional assignments
export const dailyDevotionalAssignments = pgTable("daily_devotional_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  devotionalId: integer("devotional_id").references(() => devotionals.id),
  assignedDate: varchar("assigned_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  isCompleted: integer("is_completed").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Devotional streaks
export const devotionalStreaks = pgTable("devotional_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastCompletedDate: varchar("last_completed_date", { length: 10 }), // YYYY-MM-DD format
  totalDevotionalsCompleted: integer("total_devotionals_completed").default(0),
  streakMilestonesAchieved: text("streak_milestones_achieved").array(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Conversation memories (for AI context)
export const conversationMemories = pgTable("conversation_memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  keyTopics: text("key_topics").array(),
  emotionalPatterns: text("emotional_patterns").array(),
  struggles: text("struggles").array(),
  growthMoments: text("growth_moments").array(),
  recurringQuestions: text("recurring_questions").array(),
  faithStageIndicators: varchar("faith_stage_indicators", { length: 50 }),
  summary: text("summary"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas for devotional system
export const insertDevotionalSchema = createInsertSchema(devotionals).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export const insertDevotionalProgressSchema = createInsertSchema(userDevotionalProgress).omit({
  id: true,
  startedAt: true,
  listenedToAudio: true,
  reflectedWithAi: true,
  isBookmarked: true,
});

export const insertDevotionalStreakSchema = createInsertSchema(devotionalStreaks).omit({
  id: true,
  updatedAt: true,
});

export const insertConversationMemorySchema = createInsertSchema(conversationMemories).omit({
  id: true,
  createdAt: true,
});

// Devotional types
export type Devotional = typeof devotionals.$inferSelect;
export type InsertDevotional = z.infer<typeof insertDevotionalSchema>;

export type UserDevotionalProgress = typeof userDevotionalProgress.$inferSelect;
export type InsertDevotionalProgress = z.infer<typeof insertDevotionalProgressSchema>;

export type DevotionalStreak = typeof devotionalStreaks.$inferSelect;
export type InsertDevotionalStreak = z.infer<typeof insertDevotionalStreakSchema>;

export type ConversationMemory = typeof conversationMemories.$inferSelect;
export type InsertConversationMemory = z.infer<typeof insertConversationMemorySchema>;

// Devotional greeting interface
export interface DevotionalGreeting {
  greeting: string;
  subtext: string;
  currentStreak: number;
  streakTarget: number;
  joinedAt?: string | null;
}

// Prayer Journal
export const prayerJournalEntries = pgTable("prayer_journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  mood: varchar("mood", { length: 50 }),
  tags: text("tags").array(),
  verseReference: varchar("verse_reference", { length: 100 }),
  verseText: text("verse_text"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPrayerJournalSchema = createInsertSchema(prayerJournalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PrayerJournalEntry = typeof prayerJournalEntries.$inferSelect;
export type InsertPrayerJournalEntry = z.infer<typeof insertPrayerJournalSchema>;

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // devotional_ready | streak_risk | milestone | weekly_reflection | welcome
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  isRead: integer("is_read").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Notification = typeof notifications.$inferSelect;

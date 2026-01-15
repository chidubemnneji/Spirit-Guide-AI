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
  
  // Generated Persona
  primaryPersona: varchar("primary_persona", { length: 50 }),
  personaModifiers: text("persona_modifiers").array(),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id"),
  title: text("title").default("New Conversation"),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  hasCompletedOnboarding: true,
});

// Auth schemas
export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

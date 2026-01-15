import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastActive: timestamp("last_active").default(sql`CURRENT_TIMESTAMP`),
});

// User Personas table
export const userPersonas = pgTable("user_personas", {
  id: serial("id").primaryKey(),
  
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserPersona = z.infer<typeof insertUserPersonaSchema>;
export type UserPersona = typeof userPersonas.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

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

import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  userPersonas,
  conversations,
  messages,
  conversationTopics,
  emotionalCheckins,
  crisisAlerts,
  memorableMoments,
  recommendationCards,
  type User,
  type InsertUser,
  type UserPersona,
  type InsertUserPersona,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type EmotionalCheckin,
  type CrisisAlert,
  type MemorableMoment,
  type RecommendationCard,
  type InsertRecommendationCard,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  getPersona(userId?: number): Promise<UserPersona | undefined>;
  createPersona(persona: InsertUserPersona): Promise<UserPersona>;
  updatePersona(id: number, updates: Partial<InsertUserPersona>): Promise<UserPersona | undefined>;

  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  getConversationsByUser(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  getTopicsForUser(userId: number): Promise<Array<{ topic: string; mentionCount: number; sentiment: string | null }>>;
  upsertTopic(userId: number, topic: string, sentiment?: string): Promise<void>;

  saveEmotionalCheckin(userId: number, emotionalState: string, intensity: number, context: string): Promise<void>;
  getRecentEmotionalCheckins(userId: number, limit?: number): Promise<EmotionalCheckin[]>;

  saveCrisisAlert(userId: number, crisisLevel: string, indicators: string[], messageExcerpt: string): Promise<void>;

  saveMoment(userId: number, conversationId: number, momentType: string, summary: string, emotionalState: string): Promise<void>;
  getRecentMoments(userId: number, limit?: number): Promise<Array<{ summary: string | null; createdAt: Date }>>;

  createRecommendationCard(card: InsertRecommendationCard): Promise<RecommendationCard>;
  getRecommendationCardsForMessage(messageId: number): Promise<RecommendationCard[]>;
  getRecommendationCard(id: number): Promise<RecommendationCard | undefined>;
  clickRecommendationCard(id: number): Promise<void>;
  completeRecommendationCard(id: number): Promise<void>;
  rateRecommendationCard(id: number, rating: number): Promise<void>;

  getUserStats(userId: number): Promise<{
    conversationCount: number;
    messageCount: number;
    practicesCompleted: number;
    currentStreak: number;
    longestStreak: number;
  }>;
}

export class DrizzleStorage implements IStorage {

  async getUser(id: number): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, lastActive: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getPersona(userId?: number): Promise<UserPersona | undefined> {
    if (userId) {
      const rows = await db
        .select()
        .from(userPersonas)
        .where(eq(userPersonas.userId, userId))
        .limit(1);
      return rows[0];
    }
    const rows = await db
      .select()
      .from(userPersonas)
      .orderBy(desc(userPersonas.createdAt))
      .limit(1);
    return rows[0];
  }

  async createPersona(persona: InsertUserPersona): Promise<UserPersona> {
    const [created] = await db.insert(userPersonas).values(persona).returning();
    return created;
  }

  async updatePersona(id: number, updates: Partial<InsertUserPersona>): Promise<UserPersona | undefined> {
    const [updated] = await db
      .update(userPersonas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPersonas.id, id))
      .returning();
    return updated;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const rows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return rows[0];
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getTopicsForUser(userId: number): Promise<Array<{ topic: string; mentionCount: number; sentiment: string | null }>> {
    const rows = await db
      .select({
        topic: conversationTopics.topic,
        mentionCount: conversationTopics.mentionCount,
        sentiment: conversationTopics.sentiment,
      })
      .from(conversationTopics)
      .where(eq(conversationTopics.userId, userId))
      .orderBy(desc(conversationTopics.mentionCount))
      .limit(10);
    return rows.map(r => ({
      topic: r.topic,
      mentionCount: r.mentionCount ?? 1,
      sentiment: r.sentiment,
    }));
  }

  async upsertTopic(userId: number, topic: string, sentiment?: string): Promise<void> {
    const normalized = topic.toLowerCase();
    const existing = await db
      .select()
      .from(conversationTopics)
      .where(and(eq(conversationTopics.userId, userId), eq(conversationTopics.topic, normalized)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(conversationTopics)
        .set({
          mentionCount: sql`${conversationTopics.mentionCount} + 1`,
          lastMentioned: new Date(),
          ...(sentiment ? { sentiment } : {}),
        })
        .where(eq(conversationTopics.id, existing[0].id));
    } else {
      await db.insert(conversationTopics).values({
        userId,
        topic: normalized,
        mentionCount: 1,
        sentiment: sentiment ?? null,
      });
    }
  }

  async saveEmotionalCheckin(userId: number, emotionalState: string, intensity: number, context: string): Promise<void> {
    await db.insert(emotionalCheckins).values({ userId, emotionalState, intensity, context });
  }

  async getRecentEmotionalCheckins(userId: number, limit = 10): Promise<EmotionalCheckin[]> {
    return db
      .select()
      .from(emotionalCheckins)
      .where(eq(emotionalCheckins.userId, userId))
      .orderBy(desc(emotionalCheckins.createdAt))
      .limit(limit);
  }

  async saveCrisisAlert(userId: number, crisisLevel: string, indicators: string[], messageExcerpt: string): Promise<void> {
    await db.insert(crisisAlerts).values({ userId, crisisLevel, indicators, messageExcerpt });
  }

  async saveMoment(userId: number, conversationId: number, momentType: string, summary: string, emotionalState: string): Promise<void> {
    await db.insert(memorableMoments).values({ userId, conversationId, momentType, summary, emotionalState });
  }

  async getRecentMoments(userId: number, limit = 5): Promise<Array<{ summary: string | null; createdAt: Date }>> {
    return db
      .select({ summary: memorableMoments.summary, createdAt: memorableMoments.createdAt })
      .from(memorableMoments)
      .where(eq(memorableMoments.userId, userId))
      .orderBy(desc(memorableMoments.createdAt))
      .limit(limit);
  }

  async createRecommendationCard(card: InsertRecommendationCard): Promise<RecommendationCard> {
    const [created] = await db.insert(recommendationCards).values(card).returning();
    return created;
  }

  async getRecommendationCardsForMessage(messageId: number): Promise<RecommendationCard[]> {
    return db
      .select()
      .from(recommendationCards)
      .where(eq(recommendationCards.messageId, messageId))
      .orderBy(recommendationCards.createdAt);
  }

  async getRecommendationCard(id: number): Promise<RecommendationCard | undefined> {
    const rows = await db.select().from(recommendationCards).where(eq(recommendationCards.id, id)).limit(1);
    return rows[0];
  }

  async clickRecommendationCard(id: number): Promise<void> {
    await db
      .update(recommendationCards)
      .set({ clicked: 1, clickedAt: new Date() })
      .where(eq(recommendationCards.id, id));
  }

  async completeRecommendationCard(id: number): Promise<void> {
    await db
      .update(recommendationCards)
      .set({ completed: 1 })
      .where(eq(recommendationCards.id, id));
  }

  async rateRecommendationCard(id: number, rating: number): Promise<void> {
    await db
      .update(recommendationCards)
      .set({ helpfulRating: rating })
      .where(eq(recommendationCards.id, id));
  }

  async getUserStats(userId: number): Promise<{
    conversationCount: number;
    messageCount: number;
    practicesCompleted: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const convRows = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.userId, userId),
        eq(conversations.channel, "general")
      ));

    const conversationCount = convRows.length;

    if (conversationCount === 0) {
      return { conversationCount: 0, messageCount: 0, practicesCompleted: 0, currentStreak: 0, longestStreak: 0 };
    }

    const convIds = convRows.map(c => c.id);

    const msgRows = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(and(inArray(messages.conversationId, convIds), eq(messages.role, "user")));

    const messageCount = msgRows.length;

    const cardRows = await db
      .select({ createdAt: recommendationCards.createdAt })
      .from(recommendationCards)
      .where(and(inArray(recommendationCards.conversationId, convIds), eq(recommendationCards.completed, 1)));

    const practicesCompleted = cardRows.length;

    const activityDates = new Set<string>();
    for (const m of msgRows) {
      if (m.createdAt) activityDates.add(new Date(m.createdAt).toISOString().split("T")[0]);
    }
    for (const c of cardRows) {
      if (c.createdAt) activityDates.add(new Date(c.createdAt).toISOString().split("T")[0]);
    }

    const sortedDates = Array.from(activityDates).sort().reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let currentStreak = 0;
    let longestStreak = 0;

    if (sortedDates.length > 0) {
      let tempStreak = 0;
      const mostRecent = sortedDates[0];

      if (mostRecent === today || mostRecent === yesterday) {
        let expectedDate = new Date(mostRecent);
        for (const dateStr of sortedDates) {
          const expectedStr = expectedDate.toISOString().split("T")[0];
          if (dateStr === expectedStr) {
            tempStreak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000);
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
            expectedDate = new Date(new Date(dateStr).getTime() - 86400000);
          }
        }
        currentStreak = tempStreak;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        let expectedDate = new Date(sortedDates[0]);
        for (const dateStr of sortedDates) {
          const expectedStr = expectedDate.toISOString().split("T")[0];
          if (dateStr === expectedStr) {
            tempStreak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000);
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
            expectedDate = new Date(new Date(dateStr).getTime() - 86400000);
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        currentStreak = 0;
      }
    }

    return {
      conversationCount,
      messageCount,
      practicesCompleted,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
    };
  }
}

export const storage = new DrizzleStorage();

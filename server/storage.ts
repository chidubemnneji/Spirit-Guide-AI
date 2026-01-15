import {
  type User,
  type InsertUser,
  type UserPersona,
  type InsertUserPersona,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ConversationTopic,
  type EmotionalCheckin,
  type CrisisAlert,
  type MemorableMoment,
  type RecommendationCard,
  type InsertRecommendationCard,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // User Personas
  getPersona(userId?: number): Promise<UserPersona | undefined>;
  createPersona(persona: InsertUserPersona): Promise<UserPersona>;
  updatePersona(id: number, updates: Partial<InsertUserPersona>): Promise<UserPersona | undefined>;

  // Conversations
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Conversation Topics (Memory)
  getTopicsForUser(userId: number): Promise<Array<{ topic: string; mentionCount: number; sentiment: string | null }>>;
  upsertTopic(userId: number, topic: string, sentiment?: string): Promise<void>;

  // Emotional Check-ins
  saveEmotionalCheckin(userId: number, emotionalState: string, intensity: number, context: string): Promise<void>;
  getRecentEmotionalCheckins(userId: number, limit?: number): Promise<EmotionalCheckin[]>;

  // Crisis Alerts
  saveCrisisAlert(userId: number, crisisLevel: string, indicators: string[], messageExcerpt: string): Promise<void>;

  // Memorable Moments
  saveMoment(userId: number, conversationId: number, momentType: string, summary: string, emotionalState: string): Promise<void>;
  getRecentMoments(userId: number, limit?: number): Promise<Array<{ summary: string | null; createdAt: Date }>>;

  // Recommendation Cards
  createRecommendationCard(card: InsertRecommendationCard): Promise<RecommendationCard>;
  getRecommendationCardsForMessage(messageId: number): Promise<RecommendationCard[]>;
  getRecommendationCard(id: number): Promise<RecommendationCard | undefined>;
  clickRecommendationCard(id: number): Promise<void>;
  completeRecommendationCard(id: number): Promise<void>;
  rateRecommendationCard(id: number, rating: number): Promise<void>;

  // User Stats
  getUserStats(): Promise<{
    conversationCount: number;
    messageCount: number;
    practicesCompleted: number;
    currentStreak: number;
    longestStreak: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private personas: Map<number, UserPersona>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private topics: Map<string, { userId: number; topic: string; mentionCount: number; sentiment: string | null; lastMentioned: Date }>;
  private emotionalCheckins: EmotionalCheckin[];
  private crisisAlerts: CrisisAlert[];
  private memorableMoments: MemorableMoment[];
  private recommendationCards: Map<number, RecommendationCard>;
  private nextUserId: number;
  private nextPersonaId: number;
  private nextConversationId: number;
  private nextMessageId: number;
  private nextTopicId: number;
  private nextCheckinId: number;
  private nextAlertId: number;
  private nextMomentId: number;
  private nextCardId: number;

  constructor() {
    this.users = new Map();
    this.personas = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.topics = new Map();
    this.emotionalCheckins = [];
    this.crisisAlerts = [];
    this.memorableMoments = [];
    this.recommendationCards = new Map();
    this.nextUserId = 1;
    this.nextPersonaId = 1;
    this.nextConversationId = 1;
    this.nextMessageId = 1;
    this.nextTopicId = 1;
    this.nextCheckinId = 1;
    this.nextAlertId = 1;
    this.nextMomentId = 1;
    this.nextCardId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const user: User = {
      id,
      email: insertUser.email,
      name: insertUser.name,
      passwordHash: insertUser.passwordHash,
      hasCompletedOnboarding: 0,
      createdAt: new Date(),
      lastActive: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates, lastActive: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // User Personas
  async getPersona(userId?: number): Promise<UserPersona | undefined> {
    if (userId) {
      return Array.from(this.personas.values()).find(p => p.userId === userId);
    }
    const personas = Array.from(this.personas.values());
    return personas[personas.length - 1];
  }

  async createPersona(persona: InsertUserPersona): Promise<UserPersona> {
    const id = this.nextPersonaId++;
    const newPersona: UserPersona = {
      id,
      userId: persona.userId ?? null,
      primaryStruggle: persona.primaryStruggle ?? null,
      depthLayerResponses: persona.depthLayerResponses ?? null,
      dailyRhythm: persona.dailyRhythm ?? null,
      pastConnectionMoment: persona.pastConnectionMoment ?? null,
      connectionRecency: persona.connectionRecency ?? null,
      peakEnergyTime: persona.peakEnergyTime ?? null,
      obstacles: persona.obstacles ?? null,
      transformationGoals: persona.transformationGoals ?? null,
      primaryPersona: persona.primaryPersona ?? null,
      personaModifiers: persona.personaModifiers ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.personas.set(id, newPersona);
    return newPersona;
  }

  async updatePersona(id: number, updates: Partial<InsertUserPersona>): Promise<UserPersona | undefined> {
    const persona = this.personas.get(id);
    if (!persona) return undefined;

    const updatedPersona: UserPersona = {
      ...persona,
      ...updates,
      updatedAt: new Date(),
    };
    this.personas.set(id, updatedPersona);
    return updatedPersona;
  }

  // Conversations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.nextConversationId++;
    const newConversation: Conversation = {
      id,
      title: conversation.title || "New Conversation",
      personaId: conversation.personaId || null,
      createdAt: new Date(),
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.conversations.delete(id);
    // Delete associated messages
    const entries = Array.from(this.messages.entries());
    for (const [msgId, msg] of entries) {
      if (msg.conversationId === id) {
        this.messages.delete(msgId);
      }
    }
  }

  // Messages
  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.nextMessageId++;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  // Conversation Topics (Memory)
  async getTopicsForUser(userId: number): Promise<Array<{ topic: string; mentionCount: number; sentiment: string | null }>> {
    return Array.from(this.topics.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 10)
      .map((t) => ({ topic: t.topic, mentionCount: t.mentionCount, sentiment: t.sentiment }));
  }

  async upsertTopic(userId: number, topic: string, sentiment?: string): Promise<void> {
    const key = `${userId}-${topic.toLowerCase()}`;
    const existing = this.topics.get(key);
    if (existing) {
      existing.mentionCount++;
      existing.lastMentioned = new Date();
      if (sentiment) existing.sentiment = sentiment;
    } else {
      this.topics.set(key, {
        userId,
        topic: topic.toLowerCase(),
        mentionCount: 1,
        sentiment: sentiment || null,
        lastMentioned: new Date(),
      });
    }
  }

  // Emotional Check-ins
  async saveEmotionalCheckin(userId: number, emotionalState: string, intensity: number, context: string): Promise<void> {
    this.emotionalCheckins.push({
      id: this.nextCheckinId++,
      userId,
      emotionalState,
      intensity,
      context,
      createdAt: new Date(),
    });
  }

  async getRecentEmotionalCheckins(userId: number, limit: number = 10): Promise<EmotionalCheckin[]> {
    return this.emotionalCheckins
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Crisis Alerts
  async saveCrisisAlert(userId: number, crisisLevel: string, indicators: string[], messageExcerpt: string): Promise<void> {
    this.crisisAlerts.push({
      id: this.nextAlertId++,
      userId,
      crisisLevel,
      indicators,
      messageExcerpt,
      reviewed: 0,
      createdAt: new Date(),
    });
  }

  // Memorable Moments
  async saveMoment(userId: number, conversationId: number, momentType: string, summary: string, emotionalState: string): Promise<void> {
    this.memorableMoments.push({
      id: this.nextMomentId++,
      userId,
      conversationId,
      momentType,
      summary,
      emotionalState,
      createdAt: new Date(),
    });
  }

  async getRecentMoments(userId: number, limit: number = 5): Promise<Array<{ summary: string | null; createdAt: Date }>> {
    return this.memorableMoments
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((m) => ({ summary: m.summary, createdAt: m.createdAt }));
  }

  // Recommendation Cards
  async createRecommendationCard(card: InsertRecommendationCard): Promise<RecommendationCard> {
    const id = this.nextCardId++;
    const newCard: RecommendationCard = {
      id,
      conversationId: card.conversationId || null,
      messageId: card.messageId || null,
      practiceType: card.practiceType || null,
      title: card.title,
      description: card.description || null,
      duration: card.duration || null,
      instructions: card.instructions || null,
      iconEmoji: card.iconEmoji || null,
      clicked: 0,
      clickedAt: null,
      completed: 0,
      helpfulRating: null,
      createdAt: new Date(),
    };
    this.recommendationCards.set(id, newCard);
    return newCard;
  }

  async getRecommendationCardsForMessage(messageId: number): Promise<RecommendationCard[]> {
    return Array.from(this.recommendationCards.values())
      .filter((c) => c.messageId === messageId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getRecommendationCard(id: number): Promise<RecommendationCard | undefined> {
    return this.recommendationCards.get(id);
  }

  async clickRecommendationCard(id: number): Promise<void> {
    const card = this.recommendationCards.get(id);
    if (card) {
      card.clicked = 1;
      card.clickedAt = new Date();
    }
  }

  async completeRecommendationCard(id: number): Promise<void> {
    const card = this.recommendationCards.get(id);
    if (card) {
      card.completed = 1;
    }
  }

  async rateRecommendationCard(id: number, rating: number): Promise<void> {
    const card = this.recommendationCards.get(id);
    if (card) {
      card.helpfulRating = rating;
    }
  }

  // User Stats
  async getUserStats(): Promise<{
    conversationCount: number;
    messageCount: number;
    practicesCompleted: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const conversations = Array.from(this.conversations.values());
    const messages = Array.from(this.messages.values());
    const cards = Array.from(this.recommendationCards.values());
    
    const conversationCount = conversations.length;
    const messageCount = messages.filter(m => m.role === "user").length;
    const practicesCompleted = cards.filter(c => c.completed === 1).length;
    
    // Calculate streaks based on message activity dates
    const activityDates = new Set<string>();
    messages.forEach(m => {
      if (m.role === "user" && m.createdAt) {
        const dateStr = new Date(m.createdAt).toISOString().split('T')[0];
        activityDates.add(dateStr);
      }
    });
    
    // Also count practice completions
    cards.forEach(c => {
      if (c.completed === 1 && c.createdAt) {
        const dateStr = new Date(c.createdAt).toISOString().split('T')[0];
        activityDates.add(dateStr);
      }
    });
    
    const sortedDates = Array.from(activityDates).sort().reverse();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if there's activity today or yesterday to start counting
    if (sortedDates.length > 0) {
      const mostRecent = sortedDates[0];
      if (mostRecent === today || mostRecent === yesterday) {
        let expectedDate = new Date(mostRecent);
        
        for (const dateStr of sortedDates) {
          const currentDate = new Date(dateStr);
          const expectedStr = expectedDate.toISOString().split('T')[0];
          
          if (dateStr === expectedStr) {
            tempStreak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000);
          } else if (dateStr < expectedStr) {
            // Gap in dates, check if this starts a new streak
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
            expectedDate = new Date(currentDate.getTime() - 86400000);
          }
        }
        
        currentStreak = tempStreak;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        // No recent activity, calculate just longest streak
        let expectedDate = new Date(sortedDates[0]);
        for (const dateStr of sortedDates) {
          const currentDate = new Date(dateStr);
          const expectedStr = expectedDate.toISOString().split('T')[0];
          
          if (dateStr === expectedStr) {
            tempStreak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000);
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
            expectedDate = new Date(currentDate.getTime() - 86400000);
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

export const storage = new MemStorage();

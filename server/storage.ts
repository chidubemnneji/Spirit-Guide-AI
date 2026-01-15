import {
  type User,
  type InsertUser,
  type UserPersona,
  type InsertUserPersona,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Personas
  getPersona(): Promise<UserPersona | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private personas: Map<number, UserPersona>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private nextUserId: number;
  private nextPersonaId: number;
  private nextConversationId: number;
  private nextMessageId: number;

  constructor() {
    this.users = new Map();
    this.personas = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.nextUserId = 1;
    this.nextPersonaId = 1;
    this.nextConversationId = 1;
    this.nextMessageId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const user: User = {
      id,
      email: insertUser.email ?? null,
      name: insertUser.name ?? null,
      createdAt: new Date(),
      lastActive: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // User Personas - only one active persona at a time for simplicity
  async getPersona(): Promise<UserPersona | undefined> {
    const personas = Array.from(this.personas.values());
    return personas[personas.length - 1]; // Return most recent
  }

  async createPersona(persona: InsertUserPersona): Promise<UserPersona> {
    const id = this.nextPersonaId++;
    const newPersona: UserPersona = {
      id,
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
}

export const storage = new MemStorage();

import type { Express, Request, Response } from "express";
import type { Session } from "express-session";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { assignPersona } from "./utils/personaAssignment";
import { buildAISystemPrompt } from "./utils/aiPromptBuilder";
import { bibleAPI } from "./bibleAPI";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { InsertUserPersona } from "@shared/schema";
import { signupSchema, loginSchema } from "@shared/schema";

interface SessionWithUser extends Session {
  userId?: number;
}

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Secure password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored);
}

// Zod schemas for request validation
const onboardingSchema = z.object({
  primaryStruggle: z.string().optional(),
  depthLayer: z.record(z.unknown()).optional(),
  behavioralReality: z.object({
    dailyRhythm: z.array(z.string()).optional(),
    pastConnectionMoment: z.string().optional(),
    connectionRecency: z.string().optional(),
    peakEnergyTime: z.string().optional(),
    obstacles: z.array(z.string()).optional(),
  }).optional(),
  transformationGoals: z.array(z.string()).optional(),
});

const messageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

const conversationSchema = z.object({
  title: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth: Signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const parseResult = signupSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid signup data",
          details: parseResult.error.flatten(),
        });
      }

      const { name, email, password } = parseResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "An account with this email already exists",
        });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ name, email, passwordHash });

      // Set session
      (req.session as SessionWithUser).userId = user.id;

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hasCompletedOnboarding: false,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ success: false, error: "Failed to create account" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid login data",
          details: parseResult.error.flatten(),
        });
      }

      const { email, password } = parseResult.data;

      const user = await storage.getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      // Update last active
      await storage.updateUser(user.id, { lastActive: new Date() });

      // Set session
      (req.session as SessionWithUser).userId = user.id;

      // Get persona if exists
      const persona = await storage.getPersona(user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hasCompletedOnboarding: !!user.hasCompletedOnboarding,
        },
        persona: persona || null,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "Failed to login" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err: Error | null) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Auth: Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ success: false, error: "User not found" });
      }

      const persona = await storage.getPersona(user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hasCompletedOnboarding: !!user.hasCompletedOnboarding,
        },
        persona: persona || null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ success: false, error: "Failed to get user" });
    }
  });

  // Submit onboarding data and create persona
  app.post("/api/onboarding", async (req: Request, res: Response) => {
    try {
      const parseResult = onboardingSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid onboarding data",
          details: parseResult.error.flatten(),
        });
      }

      const onboardingData = parseResult.data;
      const userId = (req.session as any)?.userId;

      // Assign persona based on responses
      const personaAssignment = assignPersona(onboardingData as any);

      // Build persona object for storage
      const personaData: InsertUserPersona = {
        userId: userId || null,
        primaryStruggle: onboardingData.primaryStruggle || null,
        depthLayerResponses: onboardingData.depthLayer,
        dailyRhythm: onboardingData.behavioralReality?.dailyRhythm || [],
        pastConnectionMoment: onboardingData.behavioralReality?.pastConnectionMoment || null,
        connectionRecency: onboardingData.behavioralReality?.connectionRecency || null,
        peakEnergyTime: onboardingData.behavioralReality?.peakEnergyTime || null,
        obstacles: onboardingData.behavioralReality?.obstacles || [],
        transformationGoals: onboardingData.transformationGoals || [],
        primaryPersona: personaAssignment.primary,
        personaModifiers: personaAssignment.modifiers,
      };

      // Save to storage
      await storage.createPersona(personaData);

      // Mark user as having completed onboarding
      if (userId) {
        await storage.updateUser(userId, { hasCompletedOnboarding: 1 });
      }

      res.status(200).json({
        success: true,
        persona: {
          primary: personaAssignment.primary,
          modifiers: personaAssignment.modifiers,
        },
        message: "Onboarding complete! Your personalized companion is ready.",
      });
    } catch (error) {
      console.error("Error in submitOnboarding:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete onboarding",
      });
    }
  });

  // Get current persona
  app.get("/api/persona", async (req: Request, res: Response) => {
    try {
      const persona = await storage.getPersona();
      if (!persona) {
        return res.status(404).json({
          success: false,
          error: "No persona found. Please complete onboarding first.",
        });
      }
      res.json(persona);
    } catch (error) {
      console.error("Error getting persona:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get persona",
      });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await storage.getMessages(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const parseResult = conversationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parseResult.error.flatten(),
        });
      }

      const { title } = parseResult.data;
      const conversation = await storage.createConversation({
        title: title || "New Conversation",
      });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      await storage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const parseResult = messageSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid message",
          details: parseResult.error.flatten(),
        });
      }

      const { content } = parseResult.data;

      // Verify conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Get user persona for system prompt
      const persona = await storage.getPersona();

      // Save user message
      await storage.createMessage({
        conversationId,
        role: "user",
        content,
      });

      // Get conversation history for context
      const allMessages = await storage.getMessages(conversationId);
      const chatMessages = allMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Build system prompt if persona exists
      const systemPrompt = persona
        ? buildAISystemPrompt(persona)
        : "You are a warm, empathetic spiritual companion. Help the user explore their faith journey with kindness and without judgment.";

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      try {
        // Stream response from Anthropic
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: chatMessages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            if (text) {
              fullResponse += text;
              res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
            }
          }
        }

        // Save assistant message
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullResponse,
        });

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (aiError) {
        console.error("AI streaming error:", aiError);
        
        // Provide a fallback response if AI fails
        const fallbackMessage = "I'm sorry, I'm having trouble connecting right now. Please take a moment to breathe, and try again in a few seconds. Know that you're not alone in this journey.";
        
        res.write(`data: ${JSON.stringify({ content: fallbackMessage })}\n\n`);
        
        // Save fallback as assistant message
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fallbackMessage,
        });
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // Bible API routes
  app.get("/api/bible/versions", async (req: Request, res: Response) => {
    try {
      const versions = await bibleAPI.getVersions();
      res.json(versions);
    } catch (error) {
      console.error("Error fetching Bible versions:", error);
      res.status(500).json({ error: "Failed to fetch Bible versions" });
    }
  });

  app.get("/api/bible/:bibleId/books", async (req: Request, res: Response) => {
    try {
      const { bibleId } = req.params;
      const books = await bibleAPI.getBooks(bibleId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  app.get("/api/bible/:bibleId/books/:bookId/chapters", async (req: Request, res: Response) => {
    try {
      const { bibleId, bookId } = req.params;
      const chapters = await bibleAPI.getChapters(bibleId, bookId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  app.get("/api/bible/:bibleId/chapters/:chapterId", async (req: Request, res: Response) => {
    try {
      const { bibleId, chapterId } = req.params;
      const chapter = await bibleAPI.getChapter(bibleId, chapterId);
      res.json(chapter);
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ error: "Failed to fetch chapter" });
    }
  });

  app.get("/api/bible/:bibleId/search", async (req: Request, res: Response) => {
    try {
      const { bibleId } = req.params;
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const results = await bibleAPI.search(bibleId, query);
      res.json(results);
    } catch (error) {
      console.error("Error searching Bible:", error);
      res.status(500).json({ error: "Failed to search Bible" });
    }
  });

  return httpServer;
}

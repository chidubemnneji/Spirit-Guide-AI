import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { assignPersona } from "./utils/personaAssignment";
import { buildAISystemPrompt } from "./utils/aiPromptBuilder";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { InsertUserPersona } from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

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

      // Assign persona based on responses
      const personaAssignment = assignPersona(onboardingData);

      // Build persona object for storage
      const personaData: InsertUserPersona = {
        primaryStruggle: onboardingData.primaryStruggle,
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

  return httpServer;
}

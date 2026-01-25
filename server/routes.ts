import type { Express, Request, Response } from "express";
import type { Session } from "express-session";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { assignPersona } from "./utils/personaAssignment";
import { buildAISystemPrompt, enhancePromptWithShameAwareness } from "./utils/aiPromptBuilder";
import { bibleAPI } from "./bibleAPI";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { InsertUserPersona } from "@shared/schema";
import { signupSchema, loginSchema } from "@shared/schema";
import { hybridAIClient } from "./services/hybridAIClient";
import { devotionalService } from "./services/devotionalService";
import { getScripturesByFeeling, isValidFeeling, detectFeelingFromMessage } from "./services/feelingScriptureService";
import { emotionalIntelligence } from "./services/emotionalIntelligence";
import { crisisDetection } from "./services/crisisDetection";
import { memoryExtractor } from "./services/memoryExtractor";
import { recommendationEngine } from "./services/recommendationEngine";
import { trustTrackingService } from "./services/trustTrackingService";
import { modeTransitionService } from "./services/modeTransitionService";
import { shameLoggingService } from "./services/shameLoggingService";

// Rate limiters for API protection
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many messages. Please wait a moment before sending more." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

interface SessionWithUser extends Session {
  userId?: number;
}

// Secure password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored);
}

// Zod schemas for request validation
const onboardingSchema = z.object({
  primaryStruggle: z.string().optional().nullable(),
  depthLayer: z.record(z.unknown()).optional().nullable(),
  behavioralReality: z.object({
    dailyRhythm: z.array(z.string()).optional(),
    pastConnectionMoment: z.string().optional().nullable(),
    connectionRecency: z.string().optional().nullable(),
    peakEnergyTime: z.string().optional().nullable(),
    obstacles: z.array(z.string()).optional(),
  }).optional().nullable(),
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
  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
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
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
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
      const session = req.session as SessionWithUser;
      const userId = session.userId;
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

  // Get user stats for account page
  app.get("/api/user/stats", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as SessionWithUser)?.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: "Not authenticated",
          conversationCount: 0,
          messageCount: 0,
          practicesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
        });
      }
      
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ 
        conversationCount: 0,
        messageCount: 0,
        practicesCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
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
      const session = req.session as SessionWithUser;
      const userId = session.userId;

      // Assign persona based on responses (transform optional fields)
      const behavioralReality = onboardingData.behavioralReality ? {
        dailyRhythm: onboardingData.behavioralReality.dailyRhythm ?? [],
        pastConnectionMoment: onboardingData.behavioralReality.pastConnectionMoment ?? null,
        connectionRecency: onboardingData.behavioralReality.connectionRecency ?? null,
        peakEnergyTime: onboardingData.behavioralReality.peakEnergyTime ?? null,
        obstacles: onboardingData.behavioralReality.obstacles ?? [],
      } : null;
      
      const personaAssignment = assignPersona({
        primaryStruggle: onboardingData.primaryStruggle ?? null,
        depthLayer: onboardingData.depthLayer ?? null,
        behavioralReality,
        transformationGoals: onboardingData.transformationGoals ?? [],
      });

      // Build persona object for storage with GRACE profile
      const graceProfile = personaAssignment.graceProfile;
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
        // GRACE Persona System v2.0 fields
        graceArchetype: graceProfile?.archetype || null,
        graceTrust: graceProfile?.trust || null,
        graceMode: graceProfile?.mode || null,
        graceEvolution: graceProfile?.evolution || null,
        graceScores: graceProfile?.scores || null,
        graceSensitivity: graceProfile?.sensitivity || null,
        graceSafetyProfile: graceProfile?.safety || null,
        graceTradition: graceProfile?.tradition || null,
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
      
      // Attach recommendation cards to assistant messages
      const messagesWithCards = await Promise.all(
        messages.map(async (msg) => {
          if (msg.role === "assistant") {
            const cards = await storage.getRecommendationCardsForMessage(msg.id);
            return { ...msg, recommendationCards: cards };
          }
          return msg;
        })
      );
      
      res.json({ ...conversation, messages: messagesWithCards });
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

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
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
      
      // Attach recommendation cards to assistant messages
      const messagesWithCards = await Promise.all(
        messages.map(async (msg) => {
          if (msg.role === "assistant") {
            const cards = await storage.getRecommendationCardsForMessage(msg.id);
            return { ...msg, recommendationCards: cards };
          }
          return msg;
        })
      );
      
      res.json({ messages: messagesWithCards });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", chatLimiter, async (req: Request, res: Response) => {
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

      // Get user and persona for system prompt
      const session = req.session as SessionWithUser;
      const userId = session.userId;
      const user = userId ? await storage.getUser(userId) : null;
      const persona = await storage.getPersona(userId);

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

      // Count user turns for phase determination (new message is already saved and included)
      const userTurnCount = allMessages.filter(m => m.role === "user").length;

      // === ENHANCED AI INTELLIGENCE ===
      // Import services dynamically to avoid circular dependencies
      
      
      
      

      // Get recent message history for context
      const recentHistory = allMessages.slice(-6).map(m => `${m.role}: ${m.content}`);

      // Run crisis detection first (safety priority)
      let crisisProtocol: string | undefined;
      try {
        const crisisAssessment = await crisisDetection.detectCrisis(content, recentHistory);
        if (crisisAssessment.crisisLevel !== "none") {
          crisisProtocol = crisisDetection.getCrisisProtocol(crisisAssessment);
          // Log crisis alert
          if (userId) {
            await storage.saveCrisisAlert(
              userId,
              crisisAssessment.crisisLevel,
              crisisAssessment.indicators,
              content.substring(0, 500)
            );
          }
        }
      } catch (crisisError) {
        console.error("Crisis detection error (continuing):", crisisError);
      }

      // Detect emotional state
      let emotionalState;
      try {
        emotionalState = await emotionalIntelligence.detectEmotion(content, recentHistory);
        // Save emotional check-in
        if (userId) {
          await storage.saveEmotionalCheckin(
            userId,
            emotionalState.primaryEmotion,
            emotionalState.intensity,
            content.substring(0, 200)
          );
        }
      } catch (emotionError) {
        console.error("Emotion detection error (continuing):", emotionError);
      }

      // Get memory context if available
      let memoryContext: string | undefined;
      if (userId) {
        try {
          const topics = await storage.getTopicsForUser(userId);
          const moments = await storage.getRecentMoments(userId);
          if (topics.length > 0 || moments.length > 0) {
            memoryContext = memoryExtractor.formatMemoryForPrompt(topics, moments);
          }
        } catch (memoryError) {
          console.error("Memory context error (continuing):", memoryError);
        }
      }

      // Build enhanced system prompt with all intelligence
      let systemPrompt = persona
        ? buildAISystemPrompt(persona, userTurnCount, user?.name, emotionalState, crisisProtocol, memoryContext)
        : "You are a warm, empathetic spiritual companion. Help the user explore their faith journey with kindness and without judgment.";

      // Enhance with shame detection (GRACE System v2.0)
      try {
        systemPrompt = enhancePromptWithShameAwareness(systemPrompt, content);
      } catch (shameError) {
        console.error("Shame detection error (continuing):", shameError);
      }

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // === CRISIS SHORT-CIRCUIT ===
      // For high/immediate crisis, return predefined safety response without relying on AI
      if (crisisProtocol && (crisisProtocol.includes("IMMEDIATE") || crisisProtocol.includes("HIGH"))) {
        const crisisResponse = `I hear that you're going through something really difficult right now, and I want you to know that you're not alone.

If you're in crisis or having thoughts of harming yourself, please reach out to someone who can help right now:
- **National Suicide Prevention Lifeline**: 988 (call or text)
- **Crisis Text Line**: Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

Your life matters, and there are people who want to help you through this moment. Please reach out to one of these resources - they're available 24/7 and completely confidential.

I'm here to listen whenever you're ready to talk.`;

        res.write(`data: ${JSON.stringify({ content: crisisResponse })}\n\n`);
        
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: crisisResponse,
        });
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      let fullResponse = "";

      // Check if AI is available before attempting call
      const aiAvailable = !!(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
      
      if (!aiAvailable) {
        // Provide phase-appropriate fallback without AI
        const fallbackResponses: Record<string, string> = {
          acknowledgment: `Thank you for sharing that with me. I can hear that this is weighing on your heart. Please know that whatever you're feeling is valid, and you're not alone in this.`,
          consolation: `What you're experiencing is something many have walked through before. "The Lord is close to the brokenhearted and saves those who are crushed in spirit." (Psalm 34:18) Your struggles don't define you, and this season will pass.`,
          reflection: `I'm wondering - when you think about what you've shared, what feels like the heaviest part right now? Sometimes naming it can help us understand it better.`,
          recommendation: `Based on what you've shared, here are some gentle ways to reconnect today:\n\n• Take a 5-minute walk outside and notice three things you're grateful for\n• Sit quietly for 2 minutes and simply breathe\n• Read Psalm 23 slowly, pausing at each verse\n\nWhat feels most right for you today?`
        };
        
        const phase = userTurnCount <= 1 ? 'acknowledgment' : 
                      userTurnCount === 2 ? 'consolation' : 
                      userTurnCount === 3 ? 'reflection' : 'recommendation';
        
        const fallbackMessage = fallbackResponses[phase];
        res.write(`data: ${JSON.stringify({ content: fallbackMessage })}\n\n`);
        
        const savedFallbackMessage = await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fallbackMessage,
        });
        
        // Generate recommendation cards for phase 4+ even in fallback mode
        let fallbackCards: any[] = [];
        if (userTurnCount >= 4) {
          try {
            
            const cardData = await recommendationEngine.generateRecommendationCards(
              content,
              persona || null,
              emotionalState
            );
            
            for (const card of cardData) {
              const savedCard = await storage.createRecommendationCard({
                conversationId,
                messageId: savedFallbackMessage.id,
                practiceType: card.practiceType,
                title: card.title,
                description: card.description,
                duration: card.duration,
                instructions: card.instructions,
                iconEmoji: card.iconEmoji,
              });
              fallbackCards.push(savedCard);
            }
          } catch (cardError) {
            console.error("Error generating fallback recommendation cards:", cardError);
          }
        }
        
        res.write(`data: ${JSON.stringify({ 
          done: true, 
          messageId: savedFallbackMessage.id,
          hasRecommendations: fallbackCards.length > 0 
        })}\n\n`);
        res.end();
        return;
      }

      try {
        let usedProvider: "claude" | "openai" = "claude";
        
        for await (const chunk of hybridAIClient.streamChat({
          systemPrompt,
          messages: chatMessages,
          maxTokens: 1024,
        })) {
          if (chunk.done) {
            usedProvider = chunk.provider;
            console.log(`[Chat] AI response completed using ${usedProvider}`);
            break;
          }
          fullResponse += chunk.content;
          res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
        }

        // Save assistant message
        const savedMessage = await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullResponse,
        });

        // For phase 4+ (recommendation phase), generate interactive practice cards
        let recommendationCards: any[] = [];
        if (userTurnCount >= 4) {
          try {
            
            const cardData = await recommendationEngine.generateRecommendationCards(
              content,
              persona || null,
              emotionalState
            );
            
            // Save cards to storage
            for (const card of cardData) {
              const savedCard = await storage.createRecommendationCard({
                conversationId,
                messageId: savedMessage.id,
                practiceType: card.practiceType,
                title: card.title,
                description: card.description,
                duration: card.duration,
                instructions: card.instructions,
                iconEmoji: card.iconEmoji,
              });
              recommendationCards.push(savedCard);
            }
          } catch (cardError) {
            console.error("Error generating recommendation cards:", cardError);
          }
        }

        // Track trust events based on session behavior
        if (userId) {
          try {
            
            
            // Track long sessions (6+ exchanges)
            if (userTurnCount >= 6 && userTurnCount % 3 === 0) {
              await trustTrackingService.recordTrustEvent(userId, "long_session", { 
                turnCount: userTurnCount, 
                conversationId 
              });
            }
            
            // Track staying during hard moments (high intensity emotions)
            if (emotionalState && emotionalState.intensity >= 7 && userTurnCount >= 2) {
              await trustTrackingService.recordTrustEvent(userId, "stayed_during_hard_moment", {
                emotion: emotionalState.primaryEmotion,
                intensity: emotionalState.intensity
              });
            }
          } catch (trustError) {
            console.error("Trust tracking error (continuing):", trustError);
          }
        }

        res.write(`data: ${JSON.stringify({ 
          done: true, 
          messageId: savedMessage.id,
          hasRecommendations: recommendationCards.length > 0 
        })}\n\n`);
        res.end();
      } catch (aiError) {
        console.error("AI streaming error:", aiError);
        
        // Provide a fallback response if AI fails
        const fallbackMessage = "I'm sorry, I'm having trouble connecting right now. Please take a moment to breathe, and try again in a few seconds. Know that you're not alone in this journey.";
        
        res.write(`data: ${JSON.stringify({ content: fallbackMessage })}\n\n`);
        
        // Save fallback as assistant message
        const savedErrorMessage = await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fallbackMessage,
        });
        
        // Generate recommendation cards for phase 4+ even in error fallback
        let errorFallbackCards: any[] = [];
        console.log(`[Chat] AI error path: userTurnCount=${userTurnCount}, generating cards: ${userTurnCount >= 4}`);
        if (userTurnCount >= 4) {
          try {
            
            const cardData = await recommendationEngine.generateRecommendationCards(
              content,
              persona || null,
              emotionalState
            );
            console.log(`[Chat] Generated ${cardData.length} recommendation cards`);
            
            for (const card of cardData) {
              const savedCard = await storage.createRecommendationCard({
                conversationId,
                messageId: savedErrorMessage.id,
                practiceType: card.practiceType,
                title: card.title,
                description: card.description,
                duration: card.duration,
                instructions: card.instructions,
                iconEmoji: card.iconEmoji,
              });
              errorFallbackCards.push(savedCard);
            }
            console.log(`[Chat] Saved ${errorFallbackCards.length} cards to storage`);
          } catch (cardError) {
            console.error("[Chat] Error generating error fallback recommendation cards:", cardError);
          }
        }
        
        res.write(`data: ${JSON.stringify({ 
          done: true, 
          messageId: savedErrorMessage.id,
          hasRecommendations: errorFallbackCards.length > 0 
        })}\n\n`);
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

  // Recommendation Card API routes
  app.get("/api/messages/:messageId/recommendations", async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }
      const cards = await storage.getRecommendationCardsForMessage(messageId);
      res.json({ cards });
    } catch (error) {
      console.error("Error fetching recommendation cards:", error);
      res.status(500).json({ error: "Failed to fetch recommendation cards" });
    }
  });

  app.post("/api/recommendations/:cardId/click", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      const card = await storage.getRecommendationCard(cardId);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      await storage.clickRecommendationCard(cardId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking card click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  app.post("/api/recommendations/:cardId/complete", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      const card = await storage.getRecommendationCard(cardId);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      await storage.completeRecommendationCard(cardId);
      
      // Track accepted suggestion for trust building
      const session = req.session as SessionWithUser;
      if (session.userId) {
        try {
          
          await trustTrackingService.recordTrustEvent(session.userId, "accepted_suggestion", {
            cardId,
            practiceType: card.practiceType,
            title: card.title
          });
        } catch (trustError) {
          console.error("Trust tracking error (continuing):", trustError);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking card completion:", error);
      res.status(500).json({ error: "Failed to track completion" });
    }
  });

  app.post("/api/recommendations/:cardId/rate", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const { rating } = req.body;
      if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      const card = await storage.getRecommendationCard(cardId);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      await storage.rateRecommendationCard(cardId, rating);
      
      // Track feedback for trust building
      const session = req.session as SessionWithUser;
      if (session.userId) {
        try {
          
          if (rating >= 4) {
            await trustTrackingService.recordTrustEvent(session.userId, "gave_positive_feedback", {
              cardId,
              rating,
              practiceType: card.practiceType
            });
          } else if (rating <= 2) {
            await trustTrackingService.recordTrustEvent(session.userId, "gave_constructive_feedback", {
              cardId,
              rating,
              practiceType: card.practiceType
            });
          }
        } catch (trustError) {
          console.error("Trust tracking error (continuing):", trustError);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking card rating:", error);
      res.status(500).json({ error: "Failed to track rating" });
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

  // Devotional Routes
  app.get("/api/devotional/greeting", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const greeting = await devotionalService.getPersonalizedGreeting(session.userId);
      res.json({ success: true, data: greeting });
    } catch (error) {
      console.error("Error fetching greeting:", error);
      res.status(500).json({ success: false, error: "Failed to fetch greeting" });
    }
  });

  app.get("/api/devotional/today", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const devotional = await devotionalService.getTodaysDevotional(session.userId);
      res.json({ success: true, data: devotional });
    } catch (error) {
      console.error("Error fetching today's devotional:", error);
      res.status(500).json({ success: false, error: "Failed to fetch devotional" });
    }
  });

  app.post("/api/devotional/:devotionalId/start", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const devotionalId = parseInt(req.params.devotionalId);
      await devotionalService.startDevotional(session.userId, devotionalId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error starting devotional:", error);
      res.status(500).json({ success: false, error: "Failed to start devotional" });
    }
  });

  app.post("/api/devotional/:devotionalId/complete", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const devotionalId = parseInt(req.params.devotionalId);
      const { timeSpentSeconds } = req.body;
      const streakData = await devotionalService.completeDevotional(
        session.userId,
        devotionalId,
        timeSpentSeconds
      );
      res.json({ success: true, data: streakData });
    } catch (error) {
      console.error("Error completing devotional:", error);
      res.status(500).json({ success: false, error: "Failed to complete devotional" });
    }
  });

  app.get("/api/devotional/streak", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const streak = await devotionalService.getStreak(session.userId);
      res.json({ success: true, data: streak });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ success: false, error: "Failed to fetch streak" });
    }
  });

  app.get("/api/devotional/journey", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const limit = parseInt(req.query.limit as string) || 10;
      const journey = await devotionalService.getJourney(session.userId, limit);
      res.json({ success: true, data: journey });
    } catch (error) {
      console.error("Error fetching journey:", error);
      res.status(500).json({ success: false, error: "Failed to fetch journey" });
    }
  });

  app.post("/api/devotional/:devotionalId/bookmark", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const devotionalId = parseInt(req.params.devotionalId);
      const isBookmarked = await devotionalService.toggleBookmark(session.userId, devotionalId);
      
      // Track bookmarked content for trust building (only when bookmarking, not unbookmarking)
      if (isBookmarked) {
        try {
          
          await trustTrackingService.recordTrustEvent(session.userId, "bookmarked_content", {
            devotionalId,
            contentType: "devotional"
          });
        } catch (trustError) {
          console.error("Trust tracking error (continuing):", trustError);
        }
      }
      
      res.json({ success: true, data: { isBookmarked } });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ success: false, error: "Failed to toggle bookmark" });
    }
  });

  app.post("/api/devotional/:devotionalId/rate", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const devotionalId = parseInt(req.params.devotionalId);
      const { rating } = req.body;
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: "Rating must be between 1 and 5" });
      }
      await devotionalService.rateDevotional(session.userId, devotionalId, rating);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rating devotional:", error);
      res.status(500).json({ success: false, error: "Failed to rate devotional" });
    }
  });

  // Feeling-based Scripture API
  app.post("/api/scripture/feeling", async (req: Request, res: Response) => {
    try {
      const { feeling, user_context, count = 3 } = req.body;

      if (!feeling) {
        return res.status(400).json({ error: "Missing required field: feeling" });
      }

      if (!isValidFeeling(feeling)) {
        return res.status(400).json({
          error: "Invalid feeling. Must be one of: anxious, sad, stressed, joyful, hopeful, confused"
        });
      }

      if (count < 1 || count > 10) {
        return res.status(400).json({ error: "Count must be between 1 and 10" });
      }

      const response = getScripturesByFeeling(feeling, user_context, count);
      res.json(response);
    } catch (error) {
      console.error("Scripture feeling API error:", error);
      res.status(500).json({ error: "Failed to retrieve scriptures" });
    }
  });

  app.get("/api/scripture/feeling", async (req: Request, res: Response) => {
    try {
      const feeling = req.query.feeling as string;
      const count = parseInt(req.query.count as string) || 3;

      if (!feeling) {
        return res.status(400).json({ error: "Missing required parameter: feeling" });
      }

      if (!isValidFeeling(feeling)) {
        return res.status(400).json({
          error: "Invalid feeling. Must be one of: anxious, sad, stressed, joyful, hopeful, confused"
        });
      }

      const response = getScripturesByFeeling(feeling, undefined, count);
      res.json(response);
    } catch (error) {
      console.error("Scripture feeling API error:", error);
      res.status(500).json({ error: "Failed to retrieve scriptures" });
    }
  });

  // Detect feeling from message
  app.post("/api/scripture/detect-feeling", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Missing required field: message" });
      }

      const detectedFeeling = detectFeelingFromMessage(message);
      
      if (detectedFeeling) {
        const scriptures = getScripturesByFeeling(detectedFeeling, undefined, 3);
        res.json({
          feeling: detectedFeeling,
          scriptures: scriptures.selected_scriptures
        });
      } else {
        res.json({ feeling: null, scriptures: [] });
      }
    } catch (error) {
      console.error("Feeling detection API error:", error);
      res.status(500).json({ error: "Failed to detect feeling" });
    }
  });

  // ============================================
  // PERSONA TRUST API
  // Record trust-building interactions
  // ============================================

  app.post("/api/persona/trust", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const { eventType, metadata } = req.body;
      
      if (!eventType) {
        return res.status(400).json({ error: "Missing eventType" });
      }

      
      
      if (!trustTrackingService.isValidEventType(eventType)) {
        const validTypes = [
          "returned_after_absence", "shared_vulnerable_content", "accepted_suggestion",
          "declined_suggestion_gracefully", "gave_positive_feedback", "gave_constructive_feedback",
          "stayed_during_hard_moment", "completed_reading_plan", "bookmarked_content", "long_session"
        ];
        return res.status(400).json({ 
          error: `Invalid eventType. Must be one of: ${validTypes.join(", ")}` 
        });
      }

      const result = await trustTrackingService.recordTrustEvent(session.userId, eventType, metadata);
      
      if (!result) {
        return res.status(500).json({ error: "Failed to record trust event" });
      }

      res.json({
        success: true,
        trust: {
          level: result.newLevel,
          score: result.newScore,
          increased: result.increased,
          previousLevel: result.previousLevel,
          previousScore: result.previousScore
        }
      });
    } catch (error) {
      console.error("Trust event error:", error);
      res.status(500).json({ error: "Failed to record trust event" });
    }
  });

  app.get("/api/persona/trust", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      
      const trustProfile = await trustTrackingService.getTrustProfile(session.userId);
      
      if (!trustProfile) {
        return res.status(404).json({ error: "Trust profile not found" });
      }

      res.json({ success: true, data: trustProfile });
    } catch (error) {
      console.error("Get trust profile error:", error);
      res.status(500).json({ error: "Failed to get trust profile" });
    }
  });

  // ============================================
  // PERSONA MODE API
  // Get and change interaction modes
  // ============================================

  app.get("/api/persona/mode", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      
      const modeInfo = await modeTransitionService.getCurrentMode(session.userId);
      
      if (!modeInfo) {
        return res.status(404).json({ error: "Mode info not found" });
      }

      res.json({
        success: true,
        currentMode: modeInfo.currentMode,
        modeInfo: {
          name: modeInfo.modeInfo.name,
          purpose: modeInfo.modeInfo.purpose,
          aiRole: modeInfo.modeInfo.aiRole,
          scripturePurpose: modeInfo.modeInfo.scripturePurpose
        },
        canTransitionTo: modeInfo.canTransitionTo,
        recentHistory: modeInfo.recentHistory
      });
    } catch (error) {
      console.error("Get mode error:", error);
      res.status(500).json({ error: "Failed to get mode" });
    }
  });

  app.post("/api/persona/mode", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const { newMode, trigger, userConsented } = req.body;
      
      if (!newMode) {
        return res.status(400).json({ error: "Missing newMode" });
      }

      
      
      if (!modeTransitionService.isValidMode(newMode)) {
        return res.status(400).json({ 
          error: "Invalid mode. Must be: support, formation, or learning" 
        });
      }

      const actualTrigger = trigger && modeTransitionService.isValidTrigger(trigger) 
        ? trigger 
        : "user_request";

      const result = await modeTransitionService.requestModeTransition(
        session.userId, 
        newMode, 
        actualTrigger, 
        userConsented ?? false
      );
      
      if (!result) {
        return res.status(500).json({ error: "Failed to transition mode" });
      }

      if ("requiresConsent" in result && result.requiresConsent) {
        return res.json({
          allowed: false,
          requiresConsent: true,
          consentPrompt: result.consentPrompt
        });
      }

      if ("allowed" in result && result.allowed === false) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Mode transition error:", error);
      res.status(500).json({ error: "Failed to transition mode" });
    }
  });

  // ============================================
  // PERSONA SHAME API
  // Log shame detections
  // ============================================

  app.post("/api/persona/shame", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const { messageId, level, types, triggers, reframeGiven } = req.body;
      
      if (!level || !types || !triggers) {
        return res.status(400).json({ error: "Missing required fields: level, types, triggers" });
      }

      // Validate types is an array
      if (!Array.isArray(types) || types.length === 0) {
        return res.status(400).json({ error: "types must be a non-empty array of strings" });
      }

      // Validate triggers is an array
      if (!Array.isArray(triggers) || triggers.length === 0) {
        return res.status(400).json({ error: "triggers must be a non-empty array of strings" });
      }

      // Validate all items are strings
      if (!types.every((t: unknown) => typeof t === "string")) {
        return res.status(400).json({ error: "All items in types must be strings" });
      }
      if (!triggers.every((t: unknown) => typeof t === "string")) {
        return res.status(400).json({ error: "All items in triggers must be strings" });
      }

      
      
      if (!shameLoggingService.isValidShameLevel(level)) {
        return res.status(400).json({ 
          error: "Invalid level. Must be: mild, moderate, or severe" 
        });
      }

      const validTypes = types.filter((t: string) => shameLoggingService.isValidShameType(t));
      if (validTypes.length === 0) {
        return res.status(400).json({ 
          error: "Invalid types. Must include at least one of: identity, performance, comparison, belonging, past, doubt, spiritual" 
        });
      }

      const result = await shameLoggingService.logShameDetection(session.userId, messageId || null, {
        level,
        types: validTypes,
        triggers,
        reframeGiven
      });
      
      if (!result) {
        return res.status(500).json({ error: "Failed to log shame detection" });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Shame detection log error:", error);
      res.status(500).json({ error: "Failed to log shame detection" });
    }
  });

  app.get("/api/persona/shame", async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionWithUser;
      if (!session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      
      
      const detections = await shameLoggingService.getRecentDetections(session.userId, limit);
      
      res.json({ success: true, data: detections });
    } catch (error) {
      console.error("Get shame detections error:", error);
      res.status(500).json({ error: "Failed to get shame detections" });
    }
  });

  return httpServer;
}

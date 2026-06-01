import type { Request, Response, NextFunction } from "express";
import type { Session } from "express-session";
import { storage } from "../storage";
import type { Conversation, RecommendationCard } from "@shared/schema";

export interface SessionWithUser extends Session {
  userId?: number;
}

// Augment Express Request so downstream handlers can read the resolved values.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
      conversation?: Conversation;
      recommendationCard?: RecommendationCard;
    }
  }
}

/**
 * Requires an authenticated session. On success, sets req.userId.
 * Anonymous access is not supported anywhere in the app.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as SessionWithUser)?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.userId = userId;
  next();
}

/**
 * Requires that the authenticated user owns the conversation referenced by
 * :id (or :conversationId). Sets req.conversation on success.
 * Returns 404 (not 403) for non-owned IDs to avoid enumeration.
 */
export async function requireOwnedConversation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.userId ?? (req.session as SessionWithUser)?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.userId = userId;

  const raw = req.params.id ?? req.params.conversationId;
  const conversationId = Number(raw);
  if (!Number.isInteger(conversationId)) {
    return res.status(400).json({ error: "Invalid conversation ID" });
  }

  const conversation = await storage.getConversation(conversationId);
  if (!conversation || conversation.userId !== userId) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  req.conversation = conversation;
  next();
}

/**
 * Requires that the authenticated user owns the recommendation card referenced
 * by :cardId, resolved via card -> conversation -> userId. Sets
 * req.recommendationCard and req.conversation on success.
 */
export async function requireOwnedRecommendation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.userId ?? (req.session as SessionWithUser)?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.userId = userId;

  const cardId = Number(req.params.cardId);
  if (!Number.isInteger(cardId)) {
    return res.status(400).json({ error: "Invalid card ID" });
  }

  const card = await storage.getRecommendationCard(cardId);
  if (!card || card.conversationId == null) {
    return res.status(404).json({ error: "Card not found" });
  }

  const conversation = await storage.getConversation(card.conversationId);
  if (!conversation || conversation.userId !== userId) {
    return res.status(404).json({ error: "Card not found" });
  }

  req.recommendationCard = card;
  req.conversation = conversation;
  next();
}

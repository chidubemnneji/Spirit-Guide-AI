// Trust Tracking Service
// Records trust-building interactions and updates trust scores/levels

import { db } from "../db";
import { trustEvents, userPersonas } from "@shared/schema";
import { eq } from "drizzle-orm";

export type TrustEventType =
  | "returned_after_absence"
  | "shared_vulnerable_content"
  | "accepted_suggestion"
  | "declined_suggestion_gracefully"
  | "gave_positive_feedback"
  | "gave_constructive_feedback"
  | "stayed_during_hard_moment"
  | "completed_reading_plan"
  | "bookmarked_content"
  | "long_session";

export type TrustLevel = "new" | "warming" | "established" | "deep";

const EVENT_WEIGHTS: Record<TrustEventType, number> = {
  returned_after_absence: 8,
  shared_vulnerable_content: 10,
  accepted_suggestion: 5,
  declined_suggestion_gracefully: 3,
  gave_positive_feedback: 4,
  gave_constructive_feedback: 6,
  stayed_during_hard_moment: 12,
  completed_reading_plan: 7,
  bookmarked_content: 2,
  long_session: 3,
};

const TRUST_LEVEL_THRESHOLDS = {
  deep: 85,
  established: 60,
  warming: 25,
  new: 0,
};

function calculateTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_LEVEL_THRESHOLDS.deep) return "deep";
  if (score >= TRUST_LEVEL_THRESHOLDS.established) return "established";
  if (score >= TRUST_LEVEL_THRESHOLDS.warming) return "warming";
  return "new";
}

export interface TrustEventResult {
  success: boolean;
  newLevel: TrustLevel;
  newScore: number;
  increased: boolean;
  previousLevel: TrustLevel;
  previousScore: number;
}

export const trustTrackingService = {
  async recordTrustEvent(
    userId: number,
    eventType: TrustEventType,
    metadata?: Record<string, unknown>
  ): Promise<TrustEventResult | null> {
    try {
      const weight = EVENT_WEIGHTS[eventType];

      const persona = await db
        .select()
        .from(userPersonas)
        .where(eq(userPersonas.userId, userId))
        .limit(1);

      if (!persona || persona.length === 0) {
        console.error("Persona not found for user:", userId);
        return null;
      }

      const currentPersona = persona[0];
      const currentTrust = (currentPersona.graceTrust as { level: TrustLevel; score: number; earnedThrough: string[] }) || {
        level: "new" as TrustLevel,
        score: 0,
        earnedThrough: [],
      };

      const previousScore = currentTrust.score || 0;
      const previousLevel = currentTrust.level || "new";
      const newScore = Math.min(100, previousScore + weight);
      const newLevel = calculateTrustLevel(newScore);

      const trustMarker = {
        type: eventType,
        timestamp: new Date().toISOString(),
        weight,
      };

      const updatedTrust = {
        level: newLevel,
        score: newScore,
        earnedThrough: [...(currentTrust.earnedThrough || []), JSON.stringify(trustMarker)],
        lastUpdated: new Date().toISOString(),
      };

      await db
        .update(userPersonas)
        .set({ graceTrust: updatedTrust })
        .where(eq(userPersonas.id, currentPersona.id));

      await db.insert(trustEvents).values({
        userId,
        personaId: currentPersona.id,
        eventType,
        weight,
        metadata: metadata || null,
      });

      return {
        success: true,
        newLevel,
        newScore,
        increased: newScore > previousScore,
        previousLevel,
        previousScore,
      };
    } catch (error) {
      console.error("Failed to record trust event:", error);
      return null;
    }
  },

  async getTrustProfile(userId: number): Promise<{ level: TrustLevel; score: number; recentEvents: any[] } | null> {
    try {
      const persona = await db
        .select()
        .from(userPersonas)
        .where(eq(userPersonas.userId, userId))
        .limit(1);

      if (!persona || persona.length === 0) {
        return null;
      }

      const currentTrust = (persona[0].graceTrust as { level: TrustLevel; score: number }) || {
        level: "new",
        score: 0,
      };

      const recentEvents = await db
        .select()
        .from(trustEvents)
        .where(eq(trustEvents.userId, userId))
        .limit(10);

      return {
        level: currentTrust.level,
        score: currentTrust.score,
        recentEvents,
      };
    } catch (error) {
      console.error("Failed to get trust profile:", error);
      return null;
    }
  },

  isValidEventType(eventType: string): eventType is TrustEventType {
    return Object.keys(EVENT_WEIGHTS).includes(eventType);
  },

  getEventWeight(eventType: TrustEventType): number {
    return EVENT_WEIGHTS[eventType];
  },

  getLevelThresholds() {
    return TRUST_LEVEL_THRESHOLDS;
  },
};

export default trustTrackingService;

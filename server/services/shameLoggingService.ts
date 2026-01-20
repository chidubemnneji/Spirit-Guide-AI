// Shame Logging Service
// Logs shame patterns detected and reframes given

import { db } from "../db";
import { shameDetections, userPersonas } from "@shared/schema";
import { eq } from "drizzle-orm";

export type ShameLevel = "mild" | "moderate" | "severe";
export type ShameType = "identity" | "performance" | "comparison" | "belonging" | "past" | "doubt" | "spiritual";

export interface ShameDetectionInput {
  level: ShameLevel;
  types: ShameType[];
  triggers: string[];
  reframeGiven?: string;
}

export interface ShameDetectionResult {
  success: boolean;
  detectionId: number;
  updatedSafetyProfile: boolean;
}

export const shameLoggingService = {
  async logShameDetection(
    userId: number,
    messageId: number | null,
    detection: ShameDetectionInput
  ): Promise<ShameDetectionResult | null> {
    try {
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

      const currentSafety = (currentPersona.graceSafetyProfile as {
        crisisWatch: boolean;
        highVulnerability: boolean;
        shamePatternDetected: boolean;
        lastShameReframe?: string;
      }) || {
        crisisWatch: false,
        highVulnerability: false,
        shamePatternDetected: false,
      };

      const updatedSafety = {
        ...currentSafety,
        shamePatternDetected: true,
        lastShameReframe: detection.reframeGiven ? new Date().toISOString() : currentSafety.lastShameReframe,
      };

      await db
        .update(userPersonas)
        .set({ graceSafetyProfile: updatedSafety })
        .where(eq(userPersonas.id, currentPersona.id));

      const [inserted] = await db
        .insert(shameDetections)
        .values({
          userId,
          personaId: currentPersona.id,
          messageId,
          shameLevel: detection.level,
          shameTypes: detection.types,
          triggers: detection.triggers,
          reframeGiven: detection.reframeGiven || null,
        })
        .returning({ id: shameDetections.id });

      return {
        success: true,
        detectionId: inserted.id,
        updatedSafetyProfile: true,
      };
    } catch (error) {
      console.error("Failed to log shame detection:", error);
      return null;
    }
  },

  async markReframeAccepted(detectionId: number, accepted: boolean): Promise<boolean> {
    try {
      await db
        .update(shameDetections)
        .set({ reframeAccepted: accepted ? 1 : 0 })
        .where(eq(shameDetections.id, detectionId));
      return true;
    } catch (error) {
      console.error("Failed to mark reframe accepted:", error);
      return false;
    }
  },

  async getRecentDetections(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const detections = await db
        .select()
        .from(shameDetections)
        .where(eq(shameDetections.userId, userId))
        .limit(limit);
      return detections;
    } catch (error) {
      console.error("Failed to get recent detections:", error);
      return [];
    }
  },

  isValidShameLevel(level: string): level is ShameLevel {
    return ["mild", "moderate", "severe"].includes(level);
  },

  isValidShameType(type: string): type is ShameType {
    return ["identity", "performance", "comparison", "belonging", "past", "doubt", "spiritual"].includes(type);
  },
};

export default shameLoggingService;

// Mode Transition Service
// Handles transitions between support/formation/learning modes with consent

import { db } from "../db";
import { modeTransitions, userPersonas } from "@shared/schema";
import { eq } from "drizzle-orm";

export type InteractionMode = "support" | "formation" | "learning";
export type TransitionTrigger = "user_request" | "stability_detected" | "gentle_invitation" | "crisis_regression";

interface ModeConfig {
  name: string;
  purpose: string;
  aiRole: string;
  scripturePurpose: string;
  canTransitionTo: InteractionMode[];
  transitionRequires: "consent" | "stability" | "request";
}

const MODES: Record<InteractionMode, ModeConfig> = {
  support: {
    name: "Support",
    purpose: "Listen and validate",
    aiRole: "Safe presence, witness to pain",
    scripturePurpose: "Comfort, not instruction",
    canTransitionTo: ["formation"],
    transitionRequires: "consent",
  },
  formation: {
    name: "Formation",
    purpose: "Gentle growth invitations",
    aiRole: "Encouraging guide with practical steps",
    scripturePurpose: "Application and practice",
    canTransitionTo: ["support", "learning"],
    transitionRequires: "stability",
  },
  learning: {
    name: "Learning",
    purpose: "Scripture study and teaching",
    aiRole: "Teacher with depth and context",
    scripturePurpose: "Understanding and wisdom",
    canTransitionTo: ["support", "formation"],
    transitionRequires: "request",
  },
};

const CONSENT_PROMPTS: Record<string, string> = {
  "support→formation": "You've been carrying a lot. I want to make sure, are you in a place where some practical suggestions might help? Or would you rather we just keep talking?",
  "support→learning": "That's a great question to explore. Before we go there, I want to check, how are you feeling right now?",
  "formation→learning": "Would you like to explore the 'why' behind what we've been practicing?",
  "formation→support": "It sounds like you might need to pause on the 'doing' for a moment. Want to just talk?",
  "learning→support": "This is heavy. Want to step back from the ideas for a bit?",
  "learning→formation": "Want to try putting some of this into practice?",
};

const TRANSITION_MESSAGES: Record<string, string> = {
  "support→formation": "Okay, let me share something you might try...",
  "support→learning": "Let's explore that together...",
  "formation→support": "Let's pause on the 'doing' for a moment. How are you actually feeling?",
  "formation→learning": "Good question. Let me share some context...",
  "learning→support": "That's heavy. Let's step back from the ideas for a second.",
  "learning→formation": "Want to try putting some of this into practice?",
};

export interface ModeTransitionResult {
  success: boolean;
  previousMode: InteractionMode;
  newMode: InteractionMode;
  transitionMessage: string;
  modeInfo: {
    name: string;
    purpose: string;
    aiRole: string;
  };
}

export interface ConsentRequired {
  allowed: false;
  requiresConsent: true;
  consentPrompt: string;
}

export interface TransitionNotAllowed {
  allowed: false;
  error: string;
  suggestion?: string;
  consentPrompt?: string;
}

export const modeTransitionService = {
  async getCurrentMode(userId: number): Promise<{
    currentMode: InteractionMode;
    modeInfo: ModeConfig;
    canTransitionTo: InteractionMode[];
    recentHistory: any[];
  } | null> {
    try {
      const persona = await db
        .select()
        .from(userPersonas)
        .where(eq(userPersonas.userId, userId))
        .limit(1);

      if (!persona || persona.length === 0) {
        return null;
      }

      const currentMode = (persona[0].graceMode as InteractionMode) || "support";
      const modeConfig = MODES[currentMode];

      const recentHistory = await db
        .select()
        .from(modeTransitions)
        .where(eq(modeTransitions.userId, userId))
        .limit(5);

      return {
        currentMode,
        modeInfo: modeConfig,
        canTransitionTo: modeConfig.canTransitionTo,
        recentHistory,
      };
    } catch (error) {
      console.error("Failed to get current mode:", error);
      return null;
    }
  },

  async requestModeTransition(
    userId: number,
    newMode: InteractionMode,
    trigger: TransitionTrigger = "user_request",
    userConsented: boolean = false
  ): Promise<ModeTransitionResult | ConsentRequired | TransitionNotAllowed | null> {
    try {
      const persona = await db
        .select()
        .from(userPersonas)
        .where(eq(userPersonas.userId, userId))
        .limit(1);

      if (!persona || persona.length === 0) {
        return { allowed: false, error: "Persona not found" };
      }

      const currentPersona = persona[0];
      const currentMode = (currentPersona.graceMode as InteractionMode) || "support";
      const currentModeConfig = MODES[currentMode];

      if (!currentModeConfig.canTransitionTo.includes(newMode)) {
        if (currentMode === "support" && newMode === "learning") {
          return {
            allowed: false,
            error: "Cannot transition directly from support to learning",
            suggestion: "Consider transitioning to formation first",
            consentPrompt: "Before we dive into deeper questions, would it help to build some grounding practices first?",
          };
        }

        return {
          allowed: false,
          error: `Cannot transition from ${currentMode} to ${newMode}`,
        };
      }

      if (currentModeConfig.transitionRequires === "consent" && !userConsented) {
        const key = `${currentMode}→${newMode}`;
        return {
          allowed: false,
          requiresConsent: true,
          consentPrompt: CONSENT_PROMPTS[key] || "Would you like to shift gears?",
        };
      }

      await db
        .update(userPersonas)
        .set({ graceMode: newMode })
        .where(eq(userPersonas.id, currentPersona.id));

      await db.insert(modeTransitions).values({
        userId,
        personaId: currentPersona.id,
        fromMode: currentMode,
        toMode: newMode,
        trigger,
        userConsented: userConsented ? 1 : 0,
      });

      const newModeConfig = MODES[newMode];
      const transitionKey = `${currentMode}→${newMode}`;

      return {
        success: true,
        previousMode: currentMode,
        newMode,
        transitionMessage: TRANSITION_MESSAGES[transitionKey] || "",
        modeInfo: {
          name: newModeConfig.name,
          purpose: newModeConfig.purpose,
          aiRole: newModeConfig.aiRole,
        },
      };
    } catch (error) {
      console.error("Failed to transition mode:", error);
      return null;
    }
  },

  isValidMode(mode: string): mode is InteractionMode {
    return ["support", "formation", "learning"].includes(mode);
  },

  isValidTrigger(trigger: string): trigger is TransitionTrigger {
    return ["user_request", "stability_detected", "gentle_invitation", "crisis_regression"].includes(trigger);
  },

  getModeConfig(mode: InteractionMode): ModeConfig {
    return MODES[mode];
  },

  getConsentPrompt(from: InteractionMode, to: InteractionMode): string {
    const key = `${from}→${to}`;
    return CONSENT_PROMPTS[key] || "Would you like to shift gears?";
  },

  getTransitionMessage(from: InteractionMode, to: InteractionMode): string {
    const key = `${from}→${to}`;
    return TRANSITION_MESSAGES[key] || "";
  },
};

export default modeTransitionService;

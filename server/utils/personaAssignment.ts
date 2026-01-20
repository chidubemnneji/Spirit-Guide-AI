import type { OnboardingData, PersonaType } from "@shared/schema";
import type { Archetype, TrustLevel, InteractionMode } from "@shared/gracePersona";

// Simplified GRACE profile for database storage (JSONB fields)
export interface GraceProfileInit {
  archetype: Archetype;
  trust: {
    level: TrustLevel;
    score: number;
    earnedThrough: string[];
    lastUpdated: string;
  };
  mode: InteractionMode;
  evolution: {
    phase: string;
    trajectory: string;
    daysInApp: number;
    phaseStartedAt: string;
  };
  scores: {
    vulnerability: number;
    emotionalCapacity: number;
    intellectualEngagement: number;
    practicalFocus: number;
    readinessForGrowth: number;
  };
  sensitivity: {
    baseline: string;
    topics: { topic: string; level: string }[];
    detectedTriggers: string[];
  };
  safety: {
    crisisWatch: boolean;
    highVulnerability: boolean;
    shamePatternDetected: boolean;
  };
  tradition: {
    declared: string | null;
    relationship: string;
  };
}

interface PersonaAssignment {
  primary: PersonaType;
  modifiers: PersonaType[];
  graceProfile?: GraceProfileInit;
}

// Map legacy personas to GRACE archetypes
const legacyToGraceArchetype: Record<PersonaType, Archetype> = {
  seeker_in_void: "wounded_seeker",
  doubter_in_crisis: "wounded_seeker",
  isolated_wanderer: "wounded_seeker",
  guilt_ridden_striver: "wounded_seeker",
  overwhelmed_survivor: "struggling_saint",
  hungry_beginner: "eager_builder",
  momentum_breaker: "returning_prodigal",
  comparison_captive: "struggling_saint",
};

// Initialize GRACE profile based on onboarding data
function initializeGraceProfile(data: OnboardingData, primaryPersona: PersonaType): GraceProfileInit {
  const archetype = legacyToGraceArchetype[primaryPersona] || "curious_explorer";
  const now = new Date().toISOString();
  
  // Determine initial scores based on onboarding answers
  let vulnerability = 5;
  let emotionalCapacity = 5;
  let intellectualEngagement = 5;
  let practicalFocus = 5;
  let readinessForGrowth = 5;

  // Adjust scores based on primary struggle
  switch (data.primaryStruggle) {
    case "distant_from_god":
      vulnerability = 7;
      readinessForGrowth = 4;
      break;
    case "wrestling_doubts":
      intellectualEngagement = 7;
      vulnerability = 6;
      break;
    case "feel_alone":
      vulnerability = 7;
      emotionalCapacity = 4;
      break;
    case "guilt_shame":
      vulnerability = 8;
      emotionalCapacity = 4;
      break;
    case "life_overwhelming":
      emotionalCapacity = 3;
      practicalFocus = 7;
      break;
    case "new_to_faith":
      readinessForGrowth = 7;
      intellectualEngagement = 6;
      break;
  }

  // Detect topics of sensitivity
  const sensitiveTopics: { topic: string; level: string }[] = [];
  if (data.primaryStruggle === "guilt_shame") {
    sensitiveTopics.push({ topic: "shame", level: "careful" });
    sensitiveTopics.push({ topic: "failure", level: "careful" });
  }
  if (data.primaryStruggle === "wrestling_doubts") {
    sensitiveTopics.push({ topic: "certainty", level: "careful" });
    sensitiveTopics.push({ topic: "proof", level: "careful" });
  }
  if (data.primaryStruggle === "feel_alone") {
    sensitiveTopics.push({ topic: "community", level: "careful" });
    sensitiveTopics.push({ topic: "belonging", level: "careful" });
  }

  // Determine initial mode based on struggle
  let mode: InteractionMode = "support";
  if (data.primaryStruggle === "new_to_faith") {
    mode = "learning";
  }

  return {
    archetype,
    trust: {
      level: "new",
      score: 0,
      earnedThrough: [],
      lastUpdated: now,
    },
    mode,
    evolution: {
      phase: "arriving",
      trajectory: "stable",
      daysInApp: 0,
      phaseStartedAt: now,
    },
    scores: {
      vulnerability,
      emotionalCapacity,
      intellectualEngagement,
      practicalFocus,
      readinessForGrowth,
    },
    sensitivity: {
      baseline: vulnerability >= 7 ? "high" : "medium",
      topics: sensitiveTopics,
      detectedTriggers: [],
    },
    safety: {
      crisisWatch: false,
      highVulnerability: vulnerability >= 7,
      shamePatternDetected: false,
    },
    tradition: {
      declared: null,
      relationship: "exploring",
    },
  };
}

export function assignPersona(data: OnboardingData): PersonaAssignment {
  const personas: PersonaType[] = [];

  // Primary struggle mapping
  const struggleToPersona: Record<string, PersonaType> = {
    distant_from_god: "seeker_in_void",
    wrestling_doubts: "doubter_in_crisis",
    feel_alone: "isolated_wanderer",
    guilt_shame: "guilt_ridden_striver",
    life_overwhelming: "overwhelmed_survivor",
    new_to_faith: "hungry_beginner",
  };

  if (data.primaryStruggle && struggleToPersona[data.primaryStruggle]) {
    personas.push(struggleToPersona[data.primaryStruggle]);
  }

  // Check depth layer for more nuanced persona assignment
  const depthLayer = data.depthLayer as Record<string, unknown> | null;
  
  if (depthLayer) {
    // For distant_from_god with empty_room prayer experience
    if (
      data.primaryStruggle === "distant_from_god" &&
      Array.isArray(depthLayer.prayerExperience) &&
      depthLayer.prayerExperience.includes("empty_room")
    ) {
      // Reinforce seeker_in_void - already added
    }

    // For doubts with scared_losing_faith
    if (
      data.primaryStruggle === "wrestling_doubts" &&
      depthLayer.doubtEmotion === "scared_losing_faith"
    ) {
      // Reinforce doubter_in_crisis - already added
    }
  }

  // Secondary persona modifiers based on obstacles
  if (data.behavioralReality?.obstacles) {
    if (data.behavioralReality.obstacles.includes("lose_momentum")) {
      if (!personas.includes("momentum_breaker")) {
        personas.push("momentum_breaker");
      }
    }

    if (
      data.behavioralReality.obstacles.includes("compare_others") ||
      data.behavioralReality.obstacles.includes("doing_wrong")
    ) {
      if (!personas.includes("comparison_captive")) {
        personas.push("comparison_captive");
      }
    }
  }

  const primary = personas[0] || "seeker_in_void";
  const graceProfile = initializeGraceProfile(data, primary);

  return {
    primary,
    modifiers: personas.slice(1),
    graceProfile,
  };
}

import type { OnboardingData, PersonaType } from "@shared/schema";

interface PersonaAssignment {
  primary: PersonaType;
  modifiers: PersonaType[];
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

  return {
    primary: personas[0] || "seeker_in_void",
    modifiers: personas.slice(1),
  };
}

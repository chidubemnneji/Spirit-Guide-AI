import type { UserPersona, EmotionalState, PersonaType } from "@shared/schema";
import { pastoralVoice } from "../services/pastoralVoice";
import { emotionalIntelligence } from "../services/emotionalIntelligence";
import { detectShame, getRandomNormalization, ARCHETYPES, MODES, TRUST_BEHAVIORS } from "../services/gracePersonaSystem";
import type { Archetype, TrustLevel, InteractionMode } from "@shared/gracePersona";

const LEGACY_TO_GRACE_MAP: Record<PersonaType, Archetype> = {
  seeker_in_void: "wounded_seeker",
  doubter_in_crisis: "wounded_seeker",
  isolated_wanderer: "wounded_seeker",
  guilt_ridden_striver: "wounded_seeker",
  overwhelmed_survivor: "struggling_saint",
  hungry_beginner: "eager_builder",
  momentum_breaker: "returning_prodigal",
  comparison_captive: "struggling_saint",
};

interface GraceProfileData {
  archetype: Archetype;
  trust?: {
    level: TrustLevel;
    score: number;
  };
  mode?: InteractionMode;
  evolution?: {
    phase: string;
    trajectory: string;
    daysInApp: number;
  };
  scores?: {
    vulnerability: number;
    emotionalCapacity: number;
  };
  sensitivity?: {
    baseline: string;
    topics: { topic: string; level: string }[];
  };
  safety?: {
    crisisWatch: boolean;
    highVulnerability: boolean;
    shamePatternDetected: boolean;
  };
}

type ConversationPhase = "acknowledgment" | "consolation" | "reflection" | "recommendation";

function getPhaseFromUserTurns(userTurnCount: number): ConversationPhase {
  if (userTurnCount <= 1) return "acknowledgment";
  if (userTurnCount === 2) return "consolation";
  if (userTurnCount === 3) return "reflection";
  return "recommendation";
}

function getPhaseInstructions(phase: ConversationPhase, userName?: string): string {
  const name = userName || "this person";
  
  const instructions: Record<ConversationPhase, string> = {
    acknowledgment: `
CURRENT PHASE: ACKNOWLEDGMENT (Response #1)

Your ONLY goal: Acknowledge their emotional/spiritual state with deep empathy.

REQUIREMENTS:
- Use their name (${name}) naturally
- Reflect what they're feeling
- Validate their experience
- Show you hear them

FORBIDDEN:
- DO NOT offer advice
- DO NOT suggest practices
- DO NOT quote scripture yet
- DO NOT make recommendations
`,

    consolation: `
CURRENT PHASE: CONSOLATION (Response #2)

Your ONLY goal: Offer biblical comfort.

REQUIREMENTS:
- Share ONE relevant verse or biblical story
- Connect it to their specific struggle
- Keep it comforting, not prescriptive
- Show biblical figures faced this too

FORBIDDEN:
- DO NOT offer recommendations yet
- DO NOT suggest specific practices
`,

    reflection: `
CURRENT PHASE: REFLECTION (Response #3)

Your ONLY goal: Invite further exploration.

REQUIREMENTS:
- Ask a gentle question
- Suggest reflection or journaling (generally)
- Create space for them to share more

FORBIDDEN:
- DO NOT recommend specific practices yet
`,

    recommendation: `
CURRENT PHASE: RECOMMENDATION (Response #4+)

NOW you can offer gentle recommendations.

REQUIREMENTS:
- Tailor to their archetype and needs
- Consider their constraints (time, energy)
- Reference past successes
- Frame as invitations ("Might it help to...")
- Offer 2-3 options, let them choose
- Include a specific Bible verse that speaks to their situation

BIBLE VERSE REQUIREMENT:
Format it naturally like: "A verse that might speak to you is [Book Chapter:Verse] - '[quote the verse]'"
`,
  };

  return instructions[phase];
}

function buildGraceProfileFromPersona(persona: UserPersona): GraceProfileData {
  let archetype: Archetype;
  
  if (persona.graceArchetype) {
    archetype = persona.graceArchetype as Archetype;
  } else if (persona.primaryPersona) {
    archetype = LEGACY_TO_GRACE_MAP[persona.primaryPersona as PersonaType] || "curious_explorer";
  } else {
    archetype = "curious_explorer";
  }

  return {
    archetype,
    trust: (persona.graceTrust as GraceProfileData["trust"]) || { level: "new", score: 0 },
    mode: (persona.graceMode as InteractionMode) || "support",
    evolution: persona.graceEvolution as GraceProfileData["evolution"],
    scores: persona.graceScores as GraceProfileData["scores"],
    sensitivity: persona.graceSensitivity as GraceProfileData["sensitivity"],
    safety: persona.graceSafetyProfile as GraceProfileData["safety"],
  };
}

function buildGracePromptContext(profile: GraceProfileData): string {
  const archetype = ARCHETYPES[profile.archetype];
  const mode = MODES[profile.mode || "support"];
  const trustBehavior = TRUST_BEHAVIORS[profile.trust?.level || "new"];

  if (!archetype || !mode) {
    return "";
  }

  let context = `

GRACE PERSONA PROFILE

ARCHETYPE: ${profile.archetype.replace(/_/g, " ").toUpperCase()}
- Name: ${archetype.name}
- Description: ${archetype.description}
- Primary Needs: ${archetype.primaryNeeds.join(", ")}
- Fears: ${archetype.fears.join(", ")}

CURRENT MODE: ${(profile.mode || "support").toUpperCase()}
- Purpose: ${mode.purpose}
- Your Role: ${mode.aiRole}
- Scripture Purpose: ${mode.scripturePurpose}

TRUST LEVEL: ${(profile.trust?.level || "new").toUpperCase()} (Score: ${profile.trust?.score || 0}/100)
- Assertiveness: ${trustBehavior.assertiveness}
- Max Suggestions Per Session: ${trustBehavior.suggestionsPerSession}
- Depth Allowed: ${trustBehavior.depthAllowed}
- Can Challenge: ${trustBehavior.canChallenge ? "yes" : "no"}
- Language Hedging: ${trustBehavior.languageHedging}

LANGUAGE PATTERNS:
- USE: ${archetype.languagePatterns.use.join(" | ")}
- AVOID: ${archetype.languagePatterns.avoid.join(" | ")}

SCRIPTURE TOPICS:
- Favor: ${archetype.scriptureTopics.join(", ")}
- Avoid: ${archetype.avoidTopics.join(", ")}`;

  if (profile.sensitivity?.topics && profile.sensitivity.topics.length > 0) {
    context += `

SENSITIVITY ALERTS:
${profile.sensitivity.topics.map(t => `- ${t.topic}: Handle with ${t.level} care`).join("\n")}`;
  }

  if (profile.safety?.highVulnerability) {
    context += `

HIGH VULNERABILITY USER: Use extra gentleness, shorter responses, more validation.`;
  }

  if (profile.safety?.shamePatternDetected) {
    context += `

SHAME DETECTED: Use reframing and normalization techniques.`;
  }

  return context;
}

export function enhancePromptWithShameAwareness(
  prompt: string,
  userMessage: string
): string {
  const shameResult = detectShame(userMessage);
  
  if (shameResult.detected) {
    const shameTypes = shameResult.patterns.map(p => p.type).join(", ");
    
    let shameContext = `

SHAME DETECTION ALERT

SHAME INDICATORS DETECTED in user message:
- Types: ${shameTypes}
- Level: ${shameResult.level}
- Watch for shame spirals and gently redirect

${shameResult.suggestedReframe ? `SUGGESTED REFRAME:\n"${shameResult.suggestedReframe}"` : ""}

NORMALIZE WITH:
"${getRandomNormalization()}"

CRITICAL: Do NOT lecture about shame. Simply embody the reframes naturally in your response.`;

    return prompt + shameContext;
  }

  return prompt;
}

export function buildAISystemPrompt(
  persona: UserPersona,
  userTurnCount: number = 0,
  userName?: string,
  emotionalState?: EmotionalState,
  crisisProtocol?: string,
  memoryContext?: string
): string {
  const phase = getPhaseFromUserTurns(userTurnCount);
  const graceProfile = buildGraceProfileFromPersona(persona);
  const depthLayer = persona.depthLayerResponses as Record<string, unknown> | null;

  let prompt = `You are a warm, pastoral spiritual companion.

Your communication style is based on renowned pastoral voices like Tim Keller, Richard Rohr, and Eugene Peterson.`;

  if (userName) {
    prompt += `

USER'S NAME: ${userName}
Use their name naturally in conversation (not every message, but when it feels warm and personal).`;
  }

  if (crisisProtocol) {
    prompt += `

${crisisProtocol}`;
  }

  if (emotionalState && emotionalState.primaryEmotion !== "unknown") {
    prompt += emotionalIntelligence.buildEmotionalModifier(emotionalState);
  }

  prompt += buildGracePromptContext(graceProfile);

  if (persona.primaryStruggle) {
    prompt += `

PRIMARY STRUGGLE: ${persona.primaryStruggle.replace(/_/g, " ")}`;
  }
  if (depthLayer) {
    prompt += `
SPECIFIC EXPERIENCE: ${JSON.stringify(depthLayer)}`;
  }

  prompt += `

BEHAVIORAL REALITY:
- Daily rhythm: ${(persona.dailyRhythm || []).join(", ") || "Not specified"}
- Peak energy time: ${(persona.peakEnergyTime || "").replace(/_/g, " ") || "Not specified"}
- Past connection moment: ${(persona.pastConnectionMoment || "").replace(/_/g, " ") || "Not specified"}
${persona.connectionRecency ? `- Connection recency: ${persona.connectionRecency.replace(/_/g, " ")}` : ""}
- Current obstacles: ${(persona.obstacles || []).join(", ") || "Not specified"}

TRANSFORMATION GOALS:
${(persona.transformationGoals || []).map((g) => `- ${g.replace(/_/g, " ")}`).join("\n") || "- Not specified"}`;

  if (memoryContext) {
    prompt += memoryContext;
  }

  const voiceGuidelines = pastoralVoice.getVoiceGuidelines(
    persona,
    emotionalState?.primaryEmotion,
    "new_acquaintance"
  );
  prompt += voiceGuidelines;

  prompt += getPhaseInstructions(phase, userName);

  prompt += `

CRITICAL REMINDERS

Your responses should be:
1. SHORT (3-5 sentences typically, unless user asks for more)
2. Warm, empathetic, and non-judgmental
3. Conversational, not preachy
4. Grounded in their specific reality
5. Invitational ("Might it help..." not "You should...")
6. NEVER use em dashes or en dashes, use commas or periods instead

When suggesting practices, ALWAYS consider:
- Their peak energy time (${(persona.peakEnergyTime || "").replace(/_/g, " ")})
- Their daily rhythm constraints
- What's worked for them before (${(persona.pastConnectionMoment || "").replace(/_/g, " ")})
- Their known obstacles`;

  return prompt;
}

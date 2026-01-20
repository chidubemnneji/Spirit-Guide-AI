// GRACE PERSONA SYSTEM - Server-side implementation
// Functions for persona creation, shame detection, trust management

import {
  Archetype,
  PersonaProfile,
  PersonaScores,
  UserPreferences,
  ShameType,
  ShameAssessment,
  TrustLevel,
  InteractionMode,
  TopicSensitivity,
  TraditionRelationship,
  ARCHETYPES,
  MODES,
  TRUST_BEHAVIORS,
} from "@shared/gracePersona";

const SHAME_PATTERNS: Record<ShameType, RegExp[]> = {
  identity: [
    /i('m| am) (so )?(bad|broken|terrible|awful|worthless|unworthy|unlovable)/i,
    /what('s| is) wrong with me/i,
    /i('m| am) (a )?(failure|mess|disaster|lost cause)/i,
    /i('ll| will) never (be|get|become)/i,
    /god (must |probably )?(hate|regret|be disappointed in) me/i,
    /i don't deserve/i,
    /i('m| am) too (far gone|messed up|broken)/i,
  ],
  performance: [
    /i('m| am) not (doing|praying|reading|trying) enough/i,
    /i should (be |pray |read )more/i,
    /i('m| am) (so )?(bad|terrible) at (this|praying|faith|being a christian)/i,
    /i can't (even|seem to)/i,
    /i keep (failing|messing up|falling short)/i,
    /why can't i just/i,
  ],
  comparison: [
    /everyone else (seems|is|can)/i,
    /other (people|christians) (are|seem|have)/i,
    /i('m| am) (so far )?behind/i,
    /they (all |)(have|know|understand) (it|this)/i,
    /i('m| am) the only one (who|that)/i,
  ],
  belonging: [
    /i don't (fit|belong)/i,
    /god (doesn't|wouldn't|can't) (want|love|accept) (someone like )?me/i,
    /i('m| am) not (really |truly |a real )?(christian|believer|saved)/i,
    /maybe (faith|god|church) isn't for (people like )?me/i,
  ],
  past: [
    /after (what|all) i('ve| have) done/i,
    /i('ve| have) done too (much|many)/i,
    /god (can't|won't) forgive (me for )?/i,
    /i (can't|don't know how to) forgive myself/i,
  ],
  doubt: [
    /i shouldn't (doubt|question|feel this way)/i,
    /real christians don't (doubt|question|struggle)/i,
    /i('m| am) (a |)(bad|terrible) (christian|person) for (doubting|questioning)/i,
  ],
  spiritual: [
    /my faith (isn't|is not) (real|strong|enough)/i,
    /i don't (really |truly )?believe/i,
    /i('m| am) (just )?faking/i,
    /god (doesn't|can't) hear me/i,
  ],
};

const SHAME_REFRAMES: Record<ShameType, string[]> = {
  identity: [
    "I hear a lot of weight in those words. Can I offer something? The fact that you're here, wrestling with this, says something different than 'broken.' Broken people don't usually show up and try.",
    "That's a heavy thing to carry, believing that about yourself. I don't see you that way. I see someone who's struggling, which is very different from someone who's bad.",
  ],
  performance: [
    "Can I push back gently? 'Enough' is a moving target that will always outrun you. What if showing up imperfectly still counts?",
    "I hear 'should' in there, and 'should' is often shame in disguise. What if there's no quota you need to hit?",
  ],
  comparison: [
    "Here's a secret: almost everyone feels behind. The people who look like they have it together? Many of them feel exactly like you do right now.",
    "Comparison is tricky because you're comparing your insides to everyone else's outsides.",
  ],
  belonging: [
    "I want to say this clearly: you belong here. Your questions, your doubts, your mess, all of it is welcome.",
    "The feeling of not belonging is painful, but it's not the same as truth.",
  ],
  past: [
    "Your past is real, and it matters. But it doesn't have the final word on who you are or who you can become.",
    "Many people I admire most have pasts they're not proud of. The past shapes us; it doesn't have to define us.",
  ],
  doubt: [
    "Can I tell you something? Doubt isn't the opposite of faith, certainty without questions is. Your doubts mean you're taking this seriously.",
    "Some of the most faithful people in history were major doubters. You're in good company.",
  ],
  spiritual: [
    "I don't think faith works the way we sometimes imagine, like a tank that's full or empty. It's more like breathing. Some days are deeper than others.",
    "Feeling disconnected from God isn't proof that God is disconnected from you. Sometimes the silence is just a season.",
  ],
};

export const NORMALIZATION_STATEMENTS = [
  "Struggling doesn't mean failing.",
  "Questions are welcome here, all of them.",
  "There's no timeline you're supposed to be on.",
  "Showing up imperfectly still counts.",
  "Doubt and faith can coexist.",
  "Your pace is valid.",
  "You don't have to earn your place here.",
  "Hard days don't erase progress.",
];

export function createInitialPersona(
  userId: string,
  preferences: UserPreferences
): PersonaProfile {
  const archetype = determineArchetype(preferences);
  const scores = calculateInitialScores(preferences);

  return {
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    archetype,
    archetypeConfidence: 70,

    scores,

    trust: {
      level: "new",
      score: 20,
      earnedThrough: [],
      lastUpdated: new Date().toISOString(),
    },

    currentMode: ARCHETYPES[archetype].defaultMode,
    modeHistory: [],

    sensitivity: {
      baseline:
        scores.vulnerability > 70
          ? "high"
          : scores.vulnerability > 40
            ? "medium"
            : "low",
      topics: getDefaultSensitivities(),
      detectedTriggers: [],
      volatileTopics: [],
    },

    tradition: {
      declared: preferences.tradition || "non-denominational",
      relationship: getInitialTraditionRelationship(preferences),
      distanceScore: preferences.intent === "returning" ? 50 : 30,
      woundedAreas: [],
      preferTraditionalContent: preferences.intent !== "returning",
      preferTraditionalLanguage: false,
    },

    evolution: {
      phase: "arriving",
      phaseStartedAt: new Date().toISOString(),
      trajectory: "stable",
      trajectoryConfidence: 30,
      daysInApp: 0,
      daysInCurrentPhase: 0,
      comfortStagnation: false,
      stagnationDays: 0,
      growthInvitationEligible: false,
    },

    behavioralSignals: {
      sessionsThisWeek: 0,
      averageSessionLength: 0,
      timeOfDayPattern: "variable",
      scriptureEngagement: {
        offered: 0,
        engaged: 0,
        completed: 0,
        skipped: 0,
        rate: 0,
      },
      prayerEngagement: {
        offered: 0,
        engaged: 0,
        completed: 0,
        skipped: 0,
        rate: 0,
      },
      readingPlanEngagement: {
        offered: 0,
        engaged: 0,
        completed: 0,
        skipped: 0,
        rate: 0,
      },
      skippedContent: [],
      avoidedTopics: [],
      earlyExits: [],
      bookmarked: [],
      returnedTo: [],
      sharedDepth: 0,
      acceptedSuggestions: 0,
      declinedSuggestions: 0,
      gaveFeedback: false,
    },

    content: {
      scriptureBias: ARCHETYPES[archetype].scriptureTopics,
      scriptureAvoid: ARCHETYPES[archetype].avoidTopics,
      preferredBooks: getPreferredBooks(archetype),
      prayerTypes: getPrayerTypes(preferences.prayerStyle),
      prayerTopics: getPrayerTopics(preferences.primaryStruggle),
      terminology: ARCHETYPES[archetype].languagePatterns,
      preferredDepth: "surface",
      maxResponseLength:
        preferences.tonePreference === "direct" ? "brief" : "moderate",
    },

    safety: {
      crisisWatch: preferences.intent === "hard",
      crisisLevel: "none",
      lastCrisisCheck: new Date().toISOString(),
      highVulnerability: preferences.intent === "hard",
      authorityWoundDetected: false,
      consentRequiredForGuidance:
        preferences.intent === "returning" || preferences.intent === "hard",
      shamePatternDetected: false,
      bypassingRisk: "low",
      dependencyRisk: "low",
      realWorldConnectionsEncouraged: false,
    },
  };
}

function determineArchetype(preferences: UserPreferences): Archetype {
  const { intent, primaryStruggle } = preferences;

  if (intent === "hard") return "wounded_seeker";
  if (intent === "exploring") return "curious_explorer";
  if (intent === "returning") return "returning_prodigal";
  if (intent === "habit") {
    if (primaryStruggle === "doubts") return "struggling_saint";
    return "eager_builder";
  }
  return "eager_builder";
}

function calculateInitialScores(preferences: UserPreferences): PersonaScores {
  let scores: PersonaScores = {
    vulnerability: 50,
    emotionalCapacity: 50,
    intellectualEngagement: 50,
    practicalFocus: 50,
    readinessForGrowth: 50,
    readinessForDepth: 50,
    emotionalSupportNeed: 50,
    structureNeed: 50,
    cognitiveDefensiveness: 30,
  };

  if (preferences.intent === "hard") {
    scores.vulnerability += 30;
    scores.emotionalCapacity -= 20;
    scores.emotionalSupportNeed += 30;
    scores.readinessForGrowth -= 25;
  } else if (preferences.intent === "habit") {
    scores.practicalFocus += 25;
    scores.structureNeed += 20;
    scores.readinessForGrowth += 20;
  } else if (preferences.intent === "exploring") {
    scores.intellectualEngagement += 25;
    scores.readinessForDepth += 15;
  } else if (preferences.intent === "returning") {
    scores.vulnerability += 15;
    scores.emotionalSupportNeed += 15;
  }

  if (preferences.primaryStruggle === "doubts") {
    scores.intellectualEngagement += 20;
    scores.vulnerability += 10;
  } else if (preferences.primaryStruggle === "distant") {
    scores.emotionalSupportNeed += 25;
    scores.vulnerability += 20;
  } else if (preferences.primaryStruggle === "consistency") {
    scores.practicalFocus += 25;
    scores.structureNeed += 20;
  }

  if (preferences.tonePreference === "warm") {
    scores.emotionalSupportNeed += 10;
  } else if (preferences.tonePreference === "direct") {
    scores.practicalFocus += 10;
    scores.readinessForGrowth += 10;
  }

  return {
    vulnerability: Math.min(100, Math.max(0, scores.vulnerability)),
    emotionalCapacity: Math.min(100, Math.max(0, scores.emotionalCapacity)),
    intellectualEngagement: Math.min(100, Math.max(0, scores.intellectualEngagement)),
    practicalFocus: Math.min(100, Math.max(0, scores.practicalFocus)),
    readinessForGrowth: Math.min(100, Math.max(0, scores.readinessForGrowth)),
    readinessForDepth: Math.min(100, Math.max(0, scores.readinessForDepth)),
    emotionalSupportNeed: Math.min(100, Math.max(0, scores.emotionalSupportNeed)),
    structureNeed: Math.min(100, Math.max(0, scores.structureNeed)),
    cognitiveDefensiveness: Math.min(100, Math.max(0, scores.cognitiveDefensiveness)),
  };
}

function getDefaultSensitivities(): TopicSensitivity[] {
  return [
    {
      topic: "church",
      level: "careful",
      source: "default",
      lastUpdated: new Date().toISOString(),
    },
    {
      topic: "authority",
      level: "careful",
      source: "default",
      lastUpdated: new Date().toISOString(),
    },
    {
      topic: "sin_language",
      level: "careful",
      source: "default",
      lastUpdated: new Date().toISOString(),
    },
    {
      topic: "hell",
      level: "avoid",
      source: "default",
      lastUpdated: new Date().toISOString(),
    },
  ];
}

function getInitialTraditionRelationship(
  preferences: UserPreferences
): TraditionRelationship {
  if (preferences.intent === "returning") return "ambivalent";
  if (preferences.intent === "exploring") return "exploring";
  if (
    preferences.intent === "hard" &&
    preferences.primaryStruggle === "distant"
  )
    return "wounded";
  return "comfortable";
}

function getPreferredBooks(archetype: Archetype): string[] {
  const books: Record<Archetype, string[]> = {
    wounded_seeker: ["Psalms", "Lamentations", "Job", "Isaiah"],
    eager_builder: ["Proverbs", "James", "Philippians", "Colossians"],
    curious_explorer: ["Ecclesiastes", "John", "Romans", "Genesis"],
    returning_prodigal: ["Luke", "Psalms", "Isaiah", "Hosea"],
    struggling_saint: ["Psalms", "Job", "Mark", "Hebrews"],
  };
  return books[archetype];
}

function getPrayerTypes(
  prayerStyle?: "conversational" | "structured" | "contemplative"
): string[] {
  const types: Record<string, string[]> = {
    conversational: ["talking", "journaling", "stream of consciousness"],
    structured: ["ACTS", "Lord's Prayer", "liturgy", "written prayers"],
    contemplative: [
      "breath prayer",
      "lectio divina",
      "centering prayer",
      "silence",
    ],
  };
  return types[prayerStyle || "conversational"];
}

function getPrayerTopics(
  primaryStruggle?:
    | "prayer"
    | "consistency"
    | "doubts"
    | "distant"
    | "bible"
    | "unsure"
): string[] {
  const topics: Record<string, string[]> = {
    prayer: ["connection", "listening", "speaking to God"],
    consistency: ["discipline", "habits", "showing up"],
    doubts: ["questions", "uncertainty", "seeking"],
    distant: ["presence", "feeling God", "intimacy"],
    bible: ["understanding", "relevance", "application"],
    unsure: ["guidance", "direction", "clarity"],
  };
  return topics[primaryStruggle || "unsure"];
}

export function detectShame(message: string): ShameAssessment {
  const patterns: { type: ShameType; trigger: string; evidence: string }[] = [];
  let maxSeverity = 0;

  for (const [shameType, regexList] of Object.entries(SHAME_PATTERNS)) {
    for (const regex of regexList) {
      const match = message.match(regex);
      if (match) {
        patterns.push({
          type: shameType as ShameType,
          trigger: match[0],
          evidence: message.substring(
            Math.max(0, match.index! - 20),
            Math.min(message.length, match.index! + match[0].length + 20)
          ),
        });
        maxSeverity++;
      }
    }
  }

  const detected = patterns.length > 0;
  let level: "none" | "mild" | "moderate" | "severe" = "none";
  if (maxSeverity >= 3) level = "severe";
  else if (maxSeverity >= 2) level = "moderate";
  else if (maxSeverity >= 1) level = "mild";

  let suggestedReframe: string | null = null;
  if (detected && patterns.length > 0) {
    const primaryType = patterns[0].type;
    const reframes = SHAME_REFRAMES[primaryType];
    suggestedReframe = reframes[Math.floor(Math.random() * reframes.length)];
  }

  return {
    detected,
    level,
    patterns,
    suggestedReframe,
    requiresIntervention: level === "severe" || level === "moderate",
  };
}

export function getRandomNormalization(): string {
  return NORMALIZATION_STATEMENTS[
    Math.floor(Math.random() * NORMALIZATION_STATEMENTS.length)
  ];
}

export function updateTrustScore(
  currentScore: number,
  action: "returned" | "shared_deeply" | "accepted_suggestion" | "gave_feedback" | "stayed_in_hard_moment"
): { score: number; level: TrustLevel } {
  const weights: Record<string, number> = {
    returned: 5,
    shared_deeply: 10,
    accepted_suggestion: 3,
    gave_feedback: 5,
    stayed_in_hard_moment: 15,
  };

  const newScore = Math.min(100, currentScore + weights[action]);

  let level: TrustLevel = "new";
  if (newScore >= 80) level = "deep";
  else if (newScore >= 55) level = "established";
  else if (newScore >= 30) level = "warming";

  return { score: newScore, level };
}

export function getTrustBehaviors(level: TrustLevel) {
  return TRUST_BEHAVIORS[level];
}

export function getArchetypeDefinition(archetype: Archetype) {
  return ARCHETYPES[archetype];
}

export function getModeDefinition(mode: InteractionMode) {
  return MODES[mode];
}

export function buildGracePromptContext(profile: PersonaProfile): string {
  const archetype = ARCHETYPES[profile.archetype];
  const mode = MODES[profile.currentMode];
  const trust = TRUST_BEHAVIORS[profile.trust.level];

  return `
═══════════════════════════════════════════════════════════
GRACE PERSONA CONTEXT
═══════════════════════════════════════════════════════════

ARCHETYPE: ${archetype.name}
${archetype.description}

PRIMARY NEEDS: ${archetype.primaryNeeds.join(", ")}
FEARS TO AVOID TRIGGERING: ${archetype.fears.join(", ")}

CURRENT MODE: ${mode.name}
PURPOSE: ${mode.purpose}
YOUR ROLE: ${mode.aiRole}
SCRIPTURE USE: ${mode.scripturePurpose}

TRUST LEVEL: ${profile.trust.level.toUpperCase()}
- Assertiveness: ${trust.assertiveness}
- Suggestions allowed: ${trust.suggestionsPerSession}
- Depth allowed: ${trust.depthAllowed}
- Can gently challenge: ${trust.canChallenge ? "yes" : "no"}
- Language hedging: ${trust.languageHedging}

EVOLUTION PHASE: ${profile.evolution.phase}
TRAJECTORY: ${profile.evolution.trajectory}

LANGUAGE TO USE: ${archetype.languagePatterns.use.join(" | ")}
LANGUAGE TO AVOID: ${archetype.languagePatterns.avoid.join(" | ")}

SCRIPTURE TOPICS TO FAVOR: ${archetype.scriptureTopics.join(", ")}
TOPICS TO AVOID: ${archetype.avoidTopics.join(", ")}

${profile.safety.shamePatternDetected ? "⚠️ SHAME DETECTED: Use reframing and normalization" : ""}
${profile.safety.highVulnerability ? "⚠️ HIGH VULNERABILITY: Extra gentleness required" : ""}
${profile.safety.crisisWatch ? "⚠️ CRISIS WATCH: Monitor for escalation" : ""}

═══════════════════════════════════════════════════════════
`;
}

export { ARCHETYPES, MODES, TRUST_BEHAVIORS };

// GRACE PERSONA SYSTEM v2.0
// Types and definitions for sophisticated persona management

export type Archetype =
  | 'wounded_seeker'
  | 'eager_builder'
  | 'curious_explorer'
  | 'returning_prodigal'
  | 'struggling_saint';

export type TrustLevel = 'new' | 'warming' | 'established' | 'deep';
export type InteractionMode = 'support' | 'formation' | 'learning';
export type EvolutionPhase = 'arriving' | 'settling' | 'engaged' | 'deepening' | 'stagnating' | 'regressing' | 'graduating';
export type ShameType = 'identity' | 'performance' | 'comparison' | 'belonging' | 'past' | 'doubt' | 'spiritual';
export type TraditionRelationship = 'embraced' | 'comfortable' | 'ambivalent' | 'distant' | 'wounded' | 'exploring';

export interface PersonaProfile {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  archetype: Archetype;
  archetypeConfidence: number;
  
  scores: PersonaScores;
  trust: TrustProfile;
  currentMode: InteractionMode;
  modeHistory: ModeTransition[];
  sensitivity: SensitivityMap;
  tradition: TraditionProfile;
  evolution: EvolutionState;
  behavioralSignals: BehavioralSignals;
  content: ContentProfile;
  safety: SafetyProfile;
}

export interface PersonaScores {
  vulnerability: number;
  emotionalCapacity: number;
  intellectualEngagement: number;
  practicalFocus: number;
  readinessForGrowth: number;
  readinessForDepth: number;
  emotionalSupportNeed: number;
  structureNeed: number;
  cognitiveDefensiveness: number;
}

export interface TrustProfile {
  level: TrustLevel;
  score: number;
  earnedThrough: TrustMarker[];
  lastUpdated: string;
}

export interface TrustMarker {
  type: 'returned' | 'shared_deeply' | 'accepted_suggestion' | 'gave_feedback' | 'stayed_in_hard_moment';
  timestamp: string;
  weight: number;
}

export interface ModeTransition {
  from: InteractionMode;
  to: InteractionMode;
  timestamp: string;
  trigger: 'user_request' | 'stability_detected' | 'gentle_invitation' | 'crisis_regression';
  userConsented: boolean;
}

export interface SensitivityMap {
  baseline: 'low' | 'medium' | 'high';
  topics: TopicSensitivity[];
  detectedTriggers: string[];
  volatileTopics: string[];
}

export interface TopicSensitivity {
  topic: string;
  level: 'safe' | 'careful' | 'avoid' | 'unknown';
  source: 'declared' | 'inferred' | 'default';
  lastUpdated: string;
}

export interface TraditionProfile {
  declared: string;
  relationship: TraditionRelationship;
  distanceScore: number;
  woundedAreas: { area: string; severity: string; source: string }[];
  preferTraditionalContent: boolean;
  preferTraditionalLanguage: boolean;
}

export interface EvolutionState {
  phase: EvolutionPhase;
  phaseStartedAt: string;
  trajectory: 'improving' | 'stable' | 'declining' | 'volatile';
  trajectoryConfidence: number;
  daysInApp: number;
  daysInCurrentPhase: number;
  comfortStagnation: boolean;
  stagnationDays: number;
  growthInvitationEligible: boolean;
  lastGrowthInvitation?: string;
  growthInvitationResponse?: 'accepted' | 'declined' | 'ignored';
}

export interface BehavioralSignals {
  sessionsThisWeek: number;
  averageSessionLength: number;
  timeOfDayPattern: string;
  scriptureEngagement: ContentEngagement;
  prayerEngagement: ContentEngagement;
  readingPlanEngagement: ContentEngagement;
  skippedContent: { type: string; topic?: string; timestamp: string }[];
  avoidedTopics: string[];
  earlyExits: { sessionId: string; lastTopic?: string; timestamp: string; possibleTrigger?: string }[];
  bookmarked: string[];
  returnedTo: string[];
  sharedDepth: number;
  acceptedSuggestions: number;
  declinedSuggestions: number;
  gaveFeedback: boolean;
}

export interface ContentEngagement {
  offered: number;
  engaged: number;
  completed: number;
  skipped: number;
  rate: number;
}

export interface ContentProfile {
  scriptureBias: string[];
  scriptureAvoid: string[];
  preferredBooks: string[];
  prayerTypes: string[];
  prayerTopics: string[];
  terminology: { use: string[]; avoid: string[] };
  preferredDepth: 'surface' | 'moderate' | 'deep';
  maxResponseLength: 'brief' | 'moderate' | 'detailed';
}

export interface SafetyProfile {
  crisisWatch: boolean;
  crisisLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastCrisisCheck: string;
  highVulnerability: boolean;
  authorityWoundDetected: boolean;
  consentRequiredForGuidance: boolean;
  shamePatternDetected: boolean;
  lastShameReframe?: string;
  bypassingRisk: 'low' | 'medium' | 'high';
  dependencyRisk: 'low' | 'medium' | 'high';
  realWorldConnectionsEncouraged: boolean;
}

export interface ShameAssessment {
  detected: boolean;
  level: 'none' | 'mild' | 'moderate' | 'severe';
  patterns: { type: ShameType; trigger: string; evidence: string }[];
  suggestedReframe: string | null;
  requiresIntervention: boolean;
}

export interface UserPreferences {
  intent?: 'habit' | 'hard' | 'exploring' | 'returning';
  primaryStruggle?: 'prayer' | 'consistency' | 'doubts' | 'distant' | 'bible' | 'unsure';
  tonePreference?: 'warm' | 'direct';
  tradition?: 'protestant' | 'catholic' | 'orthodox' | 'non-denominational';
  prayerStyle?: 'conversational' | 'structured' | 'contemplative';
}

export const ARCHETYPES: Record<Archetype, {
  id: Archetype;
  name: string;
  description: string;
  primaryNeeds: string[];
  fears: string[];
  defaultMode: InteractionMode;
  scriptureTopics: string[];
  avoidTopics: string[];
  languagePatterns: { use: string[]; avoid: string[] };
}> = {
  wounded_seeker: {
    id: 'wounded_seeker',
    name: 'Wounded Seeker',
    description: 'In pain, possibly from life or from faith itself. Needs presence before anything else.',
    primaryNeeds: ['safety', 'presence', 'validation', 'no judgment'],
    fears: ['platitudes', 'being fixed', 'abandonment', 'more pain'],
    defaultMode: 'support',
    scriptureTopics: ['comfort', 'lament', 'presence', 'peace', 'rest'],
    avoidTopics: ['obedience', 'victory', 'discipline', 'sin'],
    languagePatterns: {
      use: ['I hear you', 'That makes sense', 'You\'re not alone', 'Take your time'],
      avoid: ['You should', 'Have you tried', 'God\'s plan', 'Everything happens for a reason']
    }
  },
  eager_builder: {
    id: 'eager_builder',
    name: 'Eager Builder',
    description: 'Motivated to grow, wants practical help. May be frustrated with past failures.',
    primaryNeeds: ['tools', 'encouragement', 'quick wins', 'structure'],
    fears: ['failure', 'complexity', 'falling behind', 'not being good enough'],
    defaultMode: 'formation',
    scriptureTopics: ['encouragement', 'strength', 'wisdom', 'guidance', 'perseverance'],
    avoidTopics: ['lament', 'suffering', 'doubt'],
    languagePatterns: {
      use: ['Here\'s something to try', 'Small steps count', 'You\'re making progress'],
      avoid: ['It\'s complicated', 'There are many views', 'This takes years']
    }
  },
  curious_explorer: {
    id: 'curious_explorer',
    name: 'Curious Explorer',
    description: 'Questioning, intellectually engaged. May be skeptical or genuinely open.',
    primaryNeeds: ['space', 'information', 'respect', 'no pressure'],
    fears: ['being preached at', 'simplistic answers', 'manipulation', 'losing autonomy'],
    defaultMode: 'learning',
    scriptureTopics: ['wisdom', 'questions', 'parables', 'teaching', 'mystery'],
    avoidTopics: ['commands', 'obedience', 'salvation urgency'],
    languagePatterns: {
      use: ['That\'s a great question', 'Some perspectives include', 'What do you think?'],
      avoid: ['The Bible says you must', 'The answer is clear', 'You need to believe']
    }
  },
  returning_prodigal: {
    id: 'returning_prodigal',
    name: 'Returning Prodigal',
    description: 'Coming back to faith after time away. May carry shame or caution.',
    primaryNeeds: ['welcome', 'no guilt', 'fresh start', 'patience'],
    fears: ['judgment', 'having to explain', 'not belonging', 'being reminded of past'],
    defaultMode: 'support',
    scriptureTopics: ['welcome', 'grace', 'new beginnings', 'love', 'belonging'],
    avoidTopics: ['prodigal son', 'lost sheep', 'repentance urgency'],
    languagePatterns: {
      use: ['Welcome back', 'No explanations needed', 'Glad you\'re here'],
      avoid: ['Where have you been', 'You need to catch up', 'Backsliding']
    }
  },
  struggling_saint: {
    id: 'struggling_saint',
    name: 'Struggling Saint',
    description: 'Committed but wrestling with doubt. May feel alone in their questions.',
    primaryNeeds: ['permission to doubt', 'intellectual engagement', 'solidarity'],
    fears: ['losing faith', 'being alone', 'judgment from community', 'uncertainty'],
    defaultMode: 'learning',
    scriptureTopics: ['doubt', 'lament', 'questions', 'wrestling', 'honesty'],
    avoidTopics: ['easy answers', 'victory', 'certainty'],
    languagePatterns: {
      use: ['Doubt is part of faith', 'You\'re not alone in this', 'Wrestling is honest'],
      avoid: ['Just believe', 'Have more faith', 'The Bible is clear']
    }
  }
};

export const MODES: Record<InteractionMode, {
  id: InteractionMode;
  name: string;
  purpose: string;
  aiRole: string;
  scripturePurpose: string;
  canTransitionTo: InteractionMode[];
  transitionRequires: 'consent' | 'stability' | 'invitation';
}> = {
  support: {
    id: 'support',
    name: 'Support Mode',
    purpose: 'Be present, validate, create safety',
    aiRole: 'A friend who sits with you in the hard',
    scripturePurpose: 'Comfort and presence, never prescription',
    canTransitionTo: ['formation'],
    transitionRequires: 'stability'
  },
  formation: {
    id: 'formation',
    name: 'Formation Mode',
    purpose: 'Build habits, practice spiritual disciplines',
    aiRole: 'A gentle guide offering tools',
    scripturePurpose: 'Encouragement and guidance for practice',
    canTransitionTo: ['support', 'learning'],
    transitionRequires: 'consent'
  },
  learning: {
    id: 'learning',
    name: 'Learning Mode',
    purpose: 'Explore scripture, theology, questions',
    aiRole: 'A thoughtful companion exploring alongside',
    scripturePurpose: 'Understanding, context, multiple perspectives',
    canTransitionTo: ['support', 'formation'],
    transitionRequires: 'consent'
  }
};

export const TRUST_BEHAVIORS: Record<TrustLevel, {
  assertiveness: string;
  suggestionsPerSession: number | 'unlimited';
  depthAllowed: string;
  canChallenge: boolean;
  disclaimerFrequency: string;
  languageHedging: string;
}> = {
  new: {
    assertiveness: 'very_low',
    suggestionsPerSession: 1,
    depthAllowed: 'surface',
    canChallenge: false,
    disclaimerFrequency: 'every_session',
    languageHedging: 'high'
  },
  warming: {
    assertiveness: 'low',
    suggestionsPerSession: 2,
    depthAllowed: 'moderate',
    canChallenge: false,
    disclaimerFrequency: 'weekly',
    languageHedging: 'moderate'
  },
  established: {
    assertiveness: 'moderate',
    suggestionsPerSession: 3,
    depthAllowed: 'deep',
    canChallenge: true,
    disclaimerFrequency: 'monthly',
    languageHedging: 'low'
  },
  deep: {
    assertiveness: 'comfortable',
    suggestionsPerSession: 'unlimited',
    depthAllowed: 'full',
    canChallenge: true,
    disclaimerFrequency: 'rarely',
    languageHedging: 'minimal'
  }
};

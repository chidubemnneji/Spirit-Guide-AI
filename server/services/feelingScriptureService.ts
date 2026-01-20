// Feeling-Based Scripture Retrieval Service
// Returns scriptures based on emotional state

export type Feeling = 'anxious' | 'sad' | 'stressed' | 'joyful' | 'hopeful' | 'confused';

export interface UserContext {
  phase?: 'arriving' | 'settling' | 'engaged' | 'deepening' | 'stagnating' | 'regressing';
  previousScripturesLiked?: string[];
  prayerStyle?: 'conversational' | 'structured' | 'contemplative';
  tradition?: 'protestant' | 'catholic' | 'orthodox' | 'non-denominational';
  preferredBooks?: string[];
}

export interface ScriptureResult {
  text: string;
  citation: string;
}

export interface ScriptureResponse {
  selected_scriptures: ScriptureResult[];
}

const FEELING_TOPIC_MAP: Record<Feeling, {
  primaryTopics: string[];
  secondaryTopics: string[];
  emotionalTone: string;
  searchQueries: string[];
}> = {
  anxious: {
    primaryTopics: ['peace', 'trust', 'fear', 'worry', 'calm'],
    secondaryTopics: ['rest', 'protection', 'presence', 'stillness'],
    emotionalTone: 'comfort',
    searchQueries: [
      'do not be anxious peace of God',
      'fear not I am with you',
      'cast your cares trust Lord',
      'be still and know peace'
    ]
  },
  sad: {
    primaryTopics: ['comfort', 'grief', 'lament', 'sorrow', 'tears'],
    secondaryTopics: ['hope', 'presence', 'healing', 'restoration'],
    emotionalTone: 'comfort',
    searchQueries: [
      'blessed are those who mourn comfort',
      'God is close to the brokenhearted',
      'weeping may last for the night joy comes',
      'he heals the brokenhearted'
    ]
  },
  stressed: {
    primaryTopics: ['rest', 'burden', 'strength', 'weariness', 'overwhelm'],
    secondaryTopics: ['peace', 'help', 'refuge', 'renewal'],
    emotionalTone: 'relief',
    searchQueries: [
      'come to me all who are weary rest',
      'cast your burden on the Lord sustain',
      'strength renewed wait on Lord',
      'my yoke is easy burden light'
    ]
  },
  joyful: {
    primaryTopics: ['joy', 'praise', 'thanksgiving', 'celebration', 'gladness'],
    secondaryTopics: ['blessing', 'gratitude', 'worship', 'delight'],
    emotionalTone: 'celebration',
    searchQueries: [
      'rejoice in the Lord always',
      'this is the day Lord has made rejoice',
      'shout for joy sing praises',
      'fullness of joy in your presence'
    ]
  },
  hopeful: {
    primaryTopics: ['hope', 'future', 'promise', 'faith', 'expectation'],
    secondaryTopics: ['trust', 'plans', 'renewal', 'waiting'],
    emotionalTone: 'encouragement',
    searchQueries: [
      'hope does not disappoint',
      'plans to give you hope and future',
      'those who hope in the Lord renew strength',
      'faith is confidence in what we hope for'
    ]
  },
  confused: {
    primaryTopics: ['wisdom', 'guidance', 'direction', 'understanding', 'clarity'],
    secondaryTopics: ['trust', 'light', 'path', 'counsel'],
    emotionalTone: 'guidance',
    searchQueries: [
      'if any lacks wisdom ask God gives generously',
      'trust in the Lord lean not own understanding',
      'your word is a lamp to my feet light path',
      'I will instruct you teach you way to go'
    ]
  }
};

const VERIFIED_SCRIPTURES: Record<Feeling, ScriptureResult[]> = {
  anxious: [
    {
      text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      citation: "Philippians 4:6-7"
    },
    {
      text: "Cast all your anxiety on him because he cares for you.",
      citation: "1 Peter 5:7"
    },
    {
      text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
      citation: "John 14:27"
    },
    {
      text: "When anxiety was great within me, your consolation brought me joy.",
      citation: "Psalm 94:19"
    },
    {
      text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.",
      citation: "Psalm 46:10"
    },
    {
      text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
      citation: "Isaiah 41:10"
    },
    {
      text: "Therefore I tell you, do not worry about your life, what you will eat or drink; or about your body, what you will wear. Is not life more than food, and the body more than clothes?",
      citation: "Matthew 6:25"
    },
    {
      text: "The Lord is my light and my salvation, whom shall I fear? The Lord is the stronghold of my life, of whom shall I be afraid?",
      citation: "Psalm 27:1"
    }
  ],
  sad: [
    {
      text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
      citation: "Psalm 34:18"
    },
    {
      text: "He heals the brokenhearted and binds up their wounds.",
      citation: "Psalm 147:3"
    },
    {
      text: "Blessed are those who mourn, for they will be comforted.",
      citation: "Matthew 5:4"
    },
    {
      text: "Weeping may stay for the night, but rejoicing comes in the morning.",
      citation: "Psalm 30:5"
    },
    {
      text: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.",
      citation: "Revelation 21:4"
    },
    {
      text: "Come to me, all you who are weary and burdened, and I will give you rest.",
      citation: "Matthew 11:28"
    },
    {
      text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
      citation: "Psalm 23:4"
    },
    {
      text: "The righteous cry out, and the Lord hears them; he delivers them from all their troubles.",
      citation: "Psalm 34:17"
    }
  ],
  stressed: [
    {
      text: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.",
      citation: "Matthew 11:28-30"
    },
    {
      text: "Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.",
      citation: "Psalm 55:22"
    },
    {
      text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      citation: "Isaiah 40:31"
    },
    {
      text: "God is our refuge and strength, an ever-present help in trouble.",
      citation: "Psalm 46:1"
    },
    {
      text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
      citation: "Psalm 23:1-3"
    },
    {
      text: "I can do all this through him who gives me strength.",
      citation: "Philippians 4:13"
    },
    {
      text: "My grace is sufficient for you, for my power is made perfect in weakness.",
      citation: "2 Corinthians 12:9"
    },
    {
      text: "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.",
      citation: "Psalm 4:8"
    }
  ],
  joyful: [
    {
      text: "Rejoice in the Lord always. I will say it again: Rejoice!",
      citation: "Philippians 4:4"
    },
    {
      text: "This is the day the Lord has made; let us rejoice and be glad in it.",
      citation: "Psalm 118:24"
    },
    {
      text: "You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.",
      citation: "Psalm 16:11"
    },
    {
      text: "The joy of the Lord is your strength.",
      citation: "Nehemiah 8:10"
    },
    {
      text: "Shout for joy to the Lord, all the earth. Worship the Lord with gladness; come before him with joyful songs.",
      citation: "Psalm 100:1-2"
    },
    {
      text: "I have told you this so that my joy may be in you and your joy may be complete.",
      citation: "John 15:11"
    },
    {
      text: "Let everything that has breath praise the Lord. Praise the Lord!",
      citation: "Psalm 150:6"
    },
    {
      text: "Sing to the Lord a new song, for he has done marvelous things.",
      citation: "Psalm 98:1"
    }
  ],
  hopeful: [
    {
      text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
      citation: "Jeremiah 29:11"
    },
    {
      text: "And hope does not put us to shame, because God's love has been poured out into our hearts through the Holy Spirit, who has been given to us.",
      citation: "Romans 5:5"
    },
    {
      text: "Now faith is confidence in what we hope for and assurance about what we do not see.",
      citation: "Hebrews 11:1"
    },
    {
      text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      citation: "Isaiah 40:31"
    },
    {
      text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",
      citation: "Romans 15:13"
    },
    {
      text: "The Lord is good to those whose hope is in him, to the one who seeks him.",
      citation: "Lamentations 3:25"
    },
    {
      text: "Be strong and take heart, all you who hope in the Lord.",
      citation: "Psalm 31:24"
    },
    {
      text: "We have this hope as an anchor for the soul, firm and secure.",
      citation: "Hebrews 6:19"
    }
  ],
  confused: [
    {
      text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",
      citation: "James 1:5"
    },
    {
      text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      citation: "Proverbs 3:5-6"
    },
    {
      text: "Your word is a lamp for my feet, a light on my path.",
      citation: "Psalm 119:105"
    },
    {
      text: "I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.",
      citation: "Psalm 32:8"
    },
    {
      text: "For God is not a God of confusion but of peace.",
      citation: "1 Corinthians 14:33"
    },
    {
      text: "Call to me and I will answer you and tell you great and unsearchable things you do not know.",
      citation: "Jeremiah 33:3"
    },
    {
      text: "The Lord will guide you always; he will satisfy your needs in a sun-scorched land and will strengthen your frame.",
      citation: "Isaiah 58:11"
    },
    {
      text: "Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, 'This is the way; walk in it.'",
      citation: "Isaiah 30:21"
    }
  ]
};

function getVerifiedFallback(
  feeling: Feeling,
  count: number,
  exclude: ScriptureResult[] = []
): ScriptureResult[] {
  const verified = VERIFIED_SCRIPTURES[feeling];
  const excludeCitations = new Set(exclude.map(s => s.citation));

  const available = verified.filter(s => !excludeCitations.has(s.citation));
  const shuffled = available.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count);
}

function applyUserBoosts(
  scriptures: ScriptureResult[],
  userContext?: UserContext
): ScriptureResult[] {
  if (!userContext) return scriptures;

  return scriptures.map(scripture => {
    let score = 0;

    if (userContext.previousScripturesLiked?.some(liked => {
      const book = scripture.citation.split(' ')[0];
      return liked.startsWith(book);
    })) {
      score += 2;
    }

    if (userContext.preferredBooks?.some(book =>
      scripture.citation.toLowerCase().includes(book.toLowerCase())
    )) {
      score += 3;
    }

    if (userContext.prayerStyle === 'contemplative' &&
        scripture.citation.toLowerCase().includes('psalm')) {
      score += 1;
    }

    if ((userContext.phase === 'arriving' || userContext.phase === 'regressing') &&
        scripture.text.length < 200) {
      score += 1;
    }

    return { ...scripture, _score: score };
  })
  .sort((a: any, b: any) => (b._score || 0) - (a._score || 0))
  .map(({ _score, ...rest }: any) => rest as ScriptureResult);
}

export function getScripturesByFeeling(
  feeling: Feeling,
  userContext?: UserContext,
  count: number = 3
): ScriptureResponse {
  const fallback = getVerifiedFallback(feeling, count);
  return {
    selected_scriptures: applyUserBoosts(fallback, userContext).slice(0, count)
  };
}

export function isValidFeeling(feeling: string): feeling is Feeling {
  return ['anxious', 'sad', 'stressed', 'joyful', 'hopeful', 'confused'].includes(feeling);
}

export function detectFeelingFromMessage(message: string): Feeling | null {
  const lowerMessage = message.toLowerCase();
  
  const feelingPatterns: Record<Feeling, RegExp[]> = {
    anxious: [
      /anxi(ous|ety)/i,
      /worr(y|ied|ying)/i,
      /nervous/i,
      /scared/i,
      /afraid/i,
      /fear(ful|ing)?/i,
      /panic/i,
      /stress(ed)? (about|over)/i,
    ],
    sad: [
      /\bsad\b/i,
      /depress(ed|ion|ing)/i,
      /cry(ing)?/i,
      /griev(e|ing)/i,
      /sorrow/i,
      /hurt(ing)?/i,
      /pain(ful)?/i,
      /heart(broken|ache)/i,
      /lost (my|a) (loved one|friend|family)/i,
    ],
    stressed: [
      /stress(ed|ful)?/i,
      /overwhelm(ed|ing)?/i,
      /exhaust(ed|ing)?/i,
      /burn(ed)?( )?out/i,
      /tired/i,
      /weary/i,
      /too much/i,
      /can't (handle|cope|take)/i,
    ],
    joyful: [
      /joy(ful)?/i,
      /happ(y|iness)/i,
      /excit(ed|ing)/i,
      /grateful/i,
      /thankful/i,
      /blessed/i,
      /celebrat(e|ing)/i,
      /good (day|news)/i,
    ],
    hopeful: [
      /hope(ful)?/i,
      /optimistic/i,
      /looking forward/i,
      /excited (about|for)/i,
      /new beginning/i,
      /fresh start/i,
      /things (are|will) get better/i,
    ],
    confused: [
      /confus(ed|ing)/i,
      /don't (know|understand)/i,
      /uncertain/i,
      /lost/i,
      /unclear/i,
      /what (should|do) i/i,
      /seeking (guidance|direction|wisdom)/i,
      /which (way|path)/i,
    ],
  };

  for (const [feeling, patterns] of Object.entries(feelingPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return feeling as Feeling;
      }
    }
  }

  return null;
}

export { FEELING_TOPIC_MAP, VERIFIED_SCRIPTURES };

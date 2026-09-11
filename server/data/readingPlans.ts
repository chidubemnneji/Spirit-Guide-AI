// Curated Bible reading plans — static, hand-authored content rather than a
// DB table, since these are editorial content we write, not user-generated.
// Each plan's day references a "Book Chapter:Verse[-Verse]" string, which
// the client resolves via the same reference-parsing already used for
// bookmarks and search results.

export interface ReadingPlanDay {
  day: number;
  reference: string;
  prompt: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  days: ReadingPlanDay[];
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "peace-in-anxiety",
    title: "7 Days of Peace",
    description: "A week of Scripture for when your mind won't settle.",
    category: "Peace",
    days: [
      { day: 1, reference: "Philippians 4:6-7", prompt: "Name one thing you're anxious about right now. Try handing it over in a single honest sentence of prayer." },
      { day: 2, reference: "Matthew 6:26-27", prompt: "Where has worry tried to convince you that you're carrying this alone?" },
      { day: 3, reference: "Psalm 23:1-4", prompt: "What would it look like to walk through today's 'valley' knowing you're not walking it alone?" },
      { day: 4, reference: "John 14:27", prompt: "Notice the difference between the peace this verse describes and the peace the world offers. Which one have you been chasing?" },
      { day: 5, reference: "Isaiah 26:3", prompt: "What has your mind been fixed on today — and could it be fixed on something steadier?" },
      { day: 6, reference: "1 Peter 5:6-7", prompt: "What's one care you can consciously cast, today, instead of quietly carrying it?" },
      { day: 7, reference: "Psalm 94:19", prompt: "Look back on this week — where did comfort actually meet you when anxiety was loudest?" },
    ],
  },
  {
    id: "gratitude-in-practice",
    title: "5 Days on Gratitude",
    description: "Short daily readings to retrain your eye toward what's good.",
    category: "Gratitude",
    days: [
      { day: 1, reference: "1 Thessalonians 5:16-18", prompt: "This says 'in all circumstances,' not 'for all circumstances.' What's one hard thing you could still give thanks in, today?" },
      { day: 2, reference: "Psalm 100:4-5", prompt: "Gratitude here is a way into God's presence, not just a mood. What's one specific thing from today you can name aloud?" },
      { day: 3, reference: "Colossians 3:15-17", prompt: "What would it look like for thankfulness to shape a decision you're making this week?" },
      { day: 4, reference: "Psalm 107:1", prompt: "'His love endures forever' — where have you seen that proven true in your own story, even briefly?" },
      { day: 5, reference: "Philippians 4:11-13", prompt: "Contentment here isn't naive — Paul learned it. What's one place you're still learning it?" },
    ],
  },
  {
    id: "when-you-feel-far",
    title: "6 Days When God Feels Distant",
    description: "For seasons when faith feels quiet instead of certain.",
    category: "Faith",
    days: [
      { day: 1, reference: "Psalm 13:1-2", prompt: "This prayer starts with a complaint, not praise. Is there something you've been afraid to say honestly in prayer?" },
      { day: 2, reference: "Psalm 42:1-3", prompt: "The psalmist names thirst before he names hope. What are you actually thirsty for right now?" },
      { day: 3, reference: "Habakkuk 3:17-18", prompt: "Habakkuk chooses joy before circumstances change. What would that choice look like for you today?" },
      { day: 4, reference: "Lamentations 3:22-24", prompt: "'New every morning' — what's one thing you need mercy to feel new about today?" },
      { day: 5, reference: "Mark 9:23-24", prompt: "'I believe; help my unbelief' might be the most honest prayer in Scripture. Is it yours today?" },
      { day: 6, reference: "Romans 8:38-39", prompt: "Read this slowly. What's the thing you secretly fear could separate you — and does this verse actually leave room for it?" },
    ],
  },
  {
    id: "forgiveness-and-freedom",
    title: "5 Days on Forgiveness",
    description: "On letting go of what someone else did — or what you did.",
    category: "Healing",
    days: [
      { day: 1, reference: "Matthew 6:14-15", prompt: "Is there a name that came to mind reading this? You don't have to act yet — just notice it." },
      { day: 2, reference: "Ephesians 4:31-32", prompt: "Which of these — bitterness, anger, or malice — is the one you're most tempted to justify?" },
      { day: 3, reference: "Colossians 3:13", prompt: "'As the Lord forgave you' changes the standard. Does that make forgiving harder or, strangely, easier?" },
      { day: 4, reference: "Psalm 103:10-12", prompt: "This is about God's forgiveness of you. Is there something you're still holding against yourself?" },
      { day: 5, reference: "Luke 23:34", prompt: "Jesus forgives before anyone asks for it. Who is one person you could begin praying this over, even quietly?" },
    ],
  },
];

export function getReadingPlan(planId: string): ReadingPlan | undefined {
  return READING_PLANS.find((p) => p.id === planId);
}

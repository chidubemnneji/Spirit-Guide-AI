import { hybridAIClient } from "./hybridAIClient";
import type { UserPersona, Devotional, InsertDevotional } from "@shared/schema";

interface UserContext {
  userId: number;
  userName: string;
  persona: UserPersona | null;
  recentEmotions: string[];
  recentTopics: string[];
  recentStruggles: string[];
  recentGrowth: string[];
  recentDevotionalThemes: string[];
}

interface GeneratedDevotional {
  title: string;
  subtitle: string;
  scripture_reference: string;
  scripture_text: string;
  opening_hook: string;
  reflection_content: string;
  todays_practice: string;
  closing_prayer: string;
  themes: string[];
}

function sanitizeText(text: string): string {
  return text.replace(/—/g, ", ").replace(/–/g, ", ");
}

export async function generateDevotional(context: UserContext): Promise<InsertDevotional> {
  console.log("[DevotionalGenerator] Generating devotional for user:", context.userId);

  const systemPrompt = buildDevotionalSystemPrompt();
  const userPrompt = buildDevotionalUserPrompt(context);

  let fullResponse = "";

  try {
    for await (const chunk of hybridAIClient.streamChat({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 2048,
    })) {
      if (chunk.done) {
        console.log(`[DevotionalGenerator] Completed using ${chunk.provider}`);
        break;
      }
      fullResponse += chunk.content;
    }

    const parsed = parseDevotionalResponse(fullResponse);
    
    return {
      title: sanitizeText(parsed.title),
      subtitle: sanitizeText(parsed.subtitle || ""),
      scriptureReference: parsed.scripture_reference,
      scriptureText: sanitizeText(parsed.scripture_text),
      openingHook: sanitizeText(parsed.opening_hook),
      reflectionContent: sanitizeText(parsed.reflection_content),
      todaysPractice: sanitizeText(parsed.todays_practice),
      closingPrayer: sanitizeText(parsed.closing_prayer),
      themes: parsed.themes || [],
      estimatedReadTime: 5,
      generatedForUserId: context.userId,
    };
  } catch (error) {
    console.error("[DevotionalGenerator] Error generating devotional:", error);
    return getFallbackDevotional(context.userId);
  }
}

function buildDevotionalSystemPrompt(): string {
  return `You are a compassionate pastoral counselor writing personalized daily devotionals.

Your devotionals should be:
- 3-5 minutes to read (500-700 words total)
- Deeply personal and relevant to the person's current spiritual state
- Biblically grounded with ONE key scripture passage
- Honest, warm, and non-judgmental (never preachy or cliche)
- Structured: opening hook, reflection, practice, prayer

IMPORTANT: Never use em dashes or en dashes. Use commas or periods instead.

Format your response as JSON:
{
  "title": "Engaging, specific title (not generic)",
  "subtitle": "One sentence about what this addresses",
  "scripture_reference": "Book Chapter:Verse",
  "scripture_text": "Full verse text",
  "opening_hook": "2-3 sentences that grab attention with story or question",
  "reflection_content": "Main body, 3-4 paragraphs, 400-500 words",
  "todays_practice": "Specific, actionable practice (not 'pray more')",
  "closing_prayer": "Personal, honest prayer, 2-3 sentences",
  "themes": ["theme1", "theme2", "theme3"]
}

Key rules:
- Meet them where they are (if struggling, acknowledge it)
- Reference their recent experiences naturally (but don't say "I read your chat")
- Choose scripture that speaks directly to their situation
- Make practice ultra-specific and doable TODAY
- Don't repeat themes from their recent devotionals`;
}

function buildDevotionalUserPrompt(context: UserContext): string {
  const archetypeDisplay = context.persona?.graceArchetype 
    ? (context.persona.graceArchetype as string).replace(/_/g, " ")
    : context.persona?.primaryPersona?.replace(/_/g, " ") || "Not set";
  
  const personaInfo = context.persona 
    ? `Archetype: ${archetypeDisplay}
Primary struggle: ${context.persona.primaryStruggle?.replace(/_/g, " ") || "Not specified"}`
    : "No persona data available";

  const emotionsText = context.recentEmotions.length > 0 
    ? context.recentEmotions.join(", ") 
    : "Not available";

  const topicsText = context.recentTopics.length > 0 
    ? context.recentTopics.join(", ") 
    : "None recorded";

  const strugglesText = context.recentStruggles.length > 0 
    ? context.recentStruggles.join(", ") 
    : "None recorded";

  const growthText = context.recentGrowth.length > 0 
    ? context.recentGrowth.join(", ") 
    : "None recorded";

  const avoidThemes = context.recentDevotionalThemes.length > 0 
    ? context.recentDevotionalThemes.join(", ") 
    : "None yet";

  return `Create a personalized devotional for ${context.userName}.

ABOUT ${context.userName.toUpperCase()}:

${personaInfo}

CURRENT STATE:
Recent emotions: ${emotionsText}

CONVERSATION INSIGHTS:
- Topics discussed: ${topicsText}
- Struggles mentioned: ${strugglesText}
- Growth moments: ${growthText}

THEMES TO AVOID (already covered recently):
${avoidThemes}

Create a devotional that speaks directly to their current spiritual state and needs.`;
}

function parseDevotionalResponse(response: string): GeneratedDevotional {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("[DevotionalGenerator] Failed to parse JSON response:", e);
  }

  return {
    title: "Finding Peace in the Present",
    subtitle: "A moment of stillness in your busy day",
    scripture_reference: "Psalm 46:10",
    scripture_text: "Be still, and know that I am God.",
    opening_hook: "In the rush of daily life, we often forget to pause. Today, let's take a breath together.",
    reflection_content: "The world moves fast. Our minds race with tasks, worries, and endless to-do lists. Yet in the midst of all this noise, there's an invitation to stillness.\n\nPsalm 46:10 doesn't ask us to achieve stillness through effort. It's an invitation, not a command. \"Be still\" is really saying \"let go\" or \"cease striving.\" It's permission to stop trying so hard.\n\nWhat would it look like to truly know that God is God, and you don't have to be? That the weight of the world isn't on your shoulders? That you can rest, even for just this moment?\n\nThis isn't about ignoring your responsibilities. It's about remembering who holds it all together, and it isn't you. There's freedom in that truth.",
    todays_practice: "Set a timer for 2 minutes. Sit somewhere comfortable, close your eyes, and simply breathe. Each time a thought comes, gently let it go and return to your breath. This isn't about emptying your mind, just about giving it a brief rest.",
    closing_prayer: "God, help me to be still today. When the noise gets loud, remind me that You are near. I don't have to have it all together. You do. Amen.",
    themes: ["stillness", "peace", "trust"],
  };
}

function getFallbackDevotional(userId: number): InsertDevotional {
  const fallback = parseDevotionalResponse("");
  return {
    title: fallback.title,
    subtitle: fallback.subtitle,
    scriptureReference: fallback.scripture_reference,
    scriptureText: fallback.scripture_text,
    openingHook: fallback.opening_hook,
    reflectionContent: fallback.reflection_content,
    todaysPractice: fallback.todays_practice,
    closingPrayer: fallback.closing_prayer,
    themes: fallback.themes,
    estimatedReadTime: 5,
    generatedForUserId: userId,
  };
}

export const devotionalGenerator = {
  generateDevotional,
};

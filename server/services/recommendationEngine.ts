import { anthropic } from "./anthropicClient";
import type { UserPersona, EmotionalState } from "@shared/schema";

export interface RecommendationCardData {
  practiceType: string;
  title: string;
  description: string;
  duration: string;
  instructions: string;
  iconEmoji: string;
}

class RecommendationEngine {
  private getIconForPractice(practice: string): string {
    const lowerPractice = practice.toLowerCase();

    if (lowerPractice.includes("walk")) return "🚶‍♂️";
    if (lowerPractice.includes("prayer") || lowerPractice.includes("pray")) return "🙏";
    if (lowerPractice.includes("silence") || lowerPractice.includes("stillness")) return "🧘";
    if (lowerPractice.includes("journal")) return "📝";
    if (lowerPractice.includes("breath")) return "💨";
    if (lowerPractice.includes("scripture") || lowerPractice.includes("bible") || lowerPractice.includes("read")) return "📖";
    if (lowerPractice.includes("coffee") || lowerPractice.includes("tea")) return "☕";
    if (lowerPractice.includes("nature") || lowerPractice.includes("outside")) return "🌳";
    if (lowerPractice.includes("music") || lowerPractice.includes("worship")) return "🎵";
    if (lowerPractice.includes("friend") || lowerPractice.includes("talk") || lowerPractice.includes("connect")) return "💬";
    if (lowerPractice.includes("gratitude") || lowerPractice.includes("thank")) return "🙌";
    if (lowerPractice.includes("rest") || lowerPractice.includes("sleep")) return "😴";
    if (lowerPractice.includes("meditat")) return "🧘‍♀️";

    return "✨";
  }

  async generateRecommendationCards(
    userMessage: string,
    userPersona: UserPersona | null,
    emotionalState?: EmotionalState
  ): Promise<RecommendationCardData[]> {
    if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
      return this.getFallbackRecommendations(emotionalState?.primaryEmotion);
    }

    try {
      const personaContext = userPersona
        ? `
User's primary struggle: ${userPersona.primaryStruggle || "not specified"}
Daily rhythm: ${(userPersona.dailyRhythm || []).join(", ") || "not specified"}
Peak energy time: ${userPersona.peakEnergyTime || "not specified"}
Obstacles: ${(userPersona.obstacles || []).join(", ") || "not specified"}
Transformation goals: ${(userPersona.transformationGoals || []).join(", ") || "not specified"}
`
        : "";

      const emotionalContext = emotionalState
        ? `Current emotional state: ${emotionalState.primaryEmotion}, intensity: ${emotionalState.intensity}/10`
        : "";

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: `You are a spiritual practice recommendation engine. Generate 3 personalized spiritual practices based on the user's message and context.

Return ONLY valid JSON (no markdown, no explanation):
{
  "recommendations": [
    {
      "practice": "Short title (3-5 words)",
      "description": "Brief description of why this practice might help (1 sentence)",
      "duration": "Time required (e.g., '5 minutes', '10 minutes')",
      "instructions": "Step-by-step instructions (2-3 sentences)",
      "when": "Best time to do this (e.g., 'morning', 'anytime', 'before bed')"
    }
  ]
}

Guidelines:
- Keep practices simple and accessible
- Consider the user's time constraints and energy level
- Match practices to their emotional state
- Include a mix: one contemplative, one active, one reflective
- Be specific and practical`,
        messages: [
          {
            role: "user",
            content: `${personaContext}${emotionalContext}

User's current message: "${userMessage}"

Generate 3 personalized spiritual practice recommendations.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        return this.getFallbackRecommendations(emotionalState?.primaryEmotion);
      }

      const parsed = JSON.parse(content.text);
      const recommendations = parsed.recommendations || [];

      return recommendations.map((rec: { practice: string; description: string; duration: string; instructions: string }) => ({
        practiceType: rec.practice,
        title: rec.practice,
        description: rec.description,
        duration: rec.duration,
        instructions: rec.instructions,
        iconEmoji: this.getIconForPractice(rec.practice),
      }));
    } catch (error) {
      console.error("Recommendation generation error:", error);
      return this.getFallbackRecommendations(emotionalState?.primaryEmotion);
    }
  }

  private getFallbackRecommendations(emotionalState?: string): RecommendationCardData[] {
    const basePractices: RecommendationCardData[] = [
      {
        practiceType: "contemplative_walk",
        title: "5-Minute Contemplative Walk",
        description: "A gentle walk to notice God in ordinary moments",
        duration: "5 minutes",
        instructions: "Step outside or walk around your space. As you walk, notice three things you're grateful for. Let each step be a quiet prayer.",
        iconEmoji: "🚶‍♂️",
      },
      {
        practiceType: "breath_prayer",
        title: "Breath Prayer",
        description: "Connect with God through your breathing",
        duration: "2 minutes",
        instructions: "Breathe in slowly while thinking 'Lord.' Breathe out slowly while thinking 'I trust you.' Repeat 5-10 times.",
        iconEmoji: "💨",
      },
      {
        practiceType: "scripture_pause",
        title: "Scripture Pause",
        description: "A moment with one verse",
        duration: "3 minutes",
        instructions: "Read Psalm 23:1 slowly: 'The Lord is my shepherd, I lack nothing.' Sit with these words. What do they stir in you?",
        iconEmoji: "📖",
      },
    ];

    if (emotionalState === "overwhelmed" || emotionalState === "struggling") {
      return [
        {
          practiceType: "grounding_rest",
          title: "Grounding Rest",
          description: "Give yourself permission to pause",
          duration: "2 minutes",
          instructions: "Sit or lie down comfortably. Place your hand on your heart. Breathe slowly and say: 'I am held. I am not alone.'",
          iconEmoji: "🧘",
        },
        basePractices[1],
        basePractices[2],
      ];
    }

    if (emotionalState === "lonely" || emotionalState === "isolated") {
      return [
        {
          practiceType: "connection_prayer",
          title: "Connection Prayer",
          description: "Remember you are not alone",
          duration: "3 minutes",
          instructions: "Close your eyes. Picture yourself surrounded by warmth and light. Whisper: 'I am seen. I am known. I am loved.'",
          iconEmoji: "🙏",
        },
        basePractices[0],
        basePractices[2],
      ];
    }

    return basePractices;
  }
}

export const recommendationEngine = new RecommendationEngine();

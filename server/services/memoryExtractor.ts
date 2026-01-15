import { anthropic } from "./anthropicClient";

interface ConversationInsights {
  topics: string[];
  emotionalState: string;
  memorableMoments: Array<{
    type: string;
    summary: string;
    emotionalImpact: string;
  }>;
  recurringThemes: string[];
  progressIndicators: string;
}

export class MemoryExtractor {
  async extractInsights(messages: Array<{ role: string; content: string }>): Promise<ConversationInsights | null> {
    try {
      if (messages.length < 4) {
        return null; // Too short to extract meaningful insights
      }

      const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        system: `You are analyzing a spiritual conversation to extract key insights.

Extract and return ONLY valid JSON (no markdown, no explanation):

{
  "topics": ["doubt", "prayer"],
  "emotionalState": "struggling",
  "memorableMoments": [
    {
      "type": "breakthrough",
      "summary": "User realized they're not alone",
      "emotionalImpact": "relieved"
    }
  ],
  "recurringThemes": ["feels_alone", "questions_faith"],
  "progressIndicators": "More open about doubt than before"
}

Be concise. Focus on what matters for continuing this person's journey.`,
        messages: [
          {
            role: "user",
            content: `Extract key insights from this spiritual conversation:\n\n${conversationText}`,
          },
        ],
        max_tokens: 1500,
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Memory extraction error:", error);
      return null;
    }
  }

  formatMemoryForPrompt(
    topics: Array<{ topic: string; mentionCount: number; sentiment: string | null }>,
    moments: Array<{ summary: string | null; createdAt: Date }>
  ): string {
    if (topics.length === 0 && moments.length === 0) {
      return "";
    }

    let memory = "\n═══════════════════════════════════════════════════════════\n";
    memory += "CONVERSATION MEMORY\n";
    memory += "═══════════════════════════════════════════════════════════\n\n";

    if (topics.length > 0) {
      memory += "RECURRING TOPICS:\n";
      topics.forEach((topic) => {
        memory += `• ${topic.topic} (${topic.mentionCount}x, ${topic.sentiment || "neutral"})\n`;
      });
      memory += "\n";
    }

    if (moments.length > 0) {
      memory += "MEMORABLE MOMENTS:\n";
      moments.forEach((moment) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(moment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        memory += `• ${moment.summary} (${daysAgo} days ago)\n`;
      });
      memory += "\n";
    }

    memory += "USE THIS MEMORY TO:\n";
    memory += '- Reference past conversations naturally ("Remember when you mentioned...")\n';
    memory += "- Track progress on recurring themes\n";
    memory += "- Celebrate growth you've observed\n";

    return memory;
  }
}

export const memoryExtractor = new MemoryExtractor();

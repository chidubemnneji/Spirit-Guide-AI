import type { EmotionalState } from "@shared/schema";
import { anthropic } from "./anthropicClient";

export class EmotionalIntelligence {
  async detectEmotion(message: string, recentHistory: string[] = []): Promise<EmotionalState> {
    try {
      const context =
        recentHistory.length > 0
          ? `Recent conversation:\n${recentHistory.join("\n")}\n\nCurrent message: ${message}`
          : `Message: ${message}`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        system: `Detect emotional state from this message. Return ONLY valid JSON (no markdown, no explanation):

{
  "primaryEmotion": "struggling|peaceful|hopeful|overwhelmed|guilty|angry|confused|lonely",
  "intensity": 1-10,
  "urgency": "low|medium|high|crisis",
  "needs": ["validation", "comfort", "guidance", "celebration", "space"],
  "toneRecommendation": "gentle|celebratory|compassionate|thoughtful"
}

Be concise and accurate. Focus on the dominant emotional state.`,
        messages: [{ role: "user", content: context }],
        max_tokens: 300,
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Emotion detection error:", error);
      return {
        primaryEmotion: "unknown",
        intensity: 5,
        urgency: "low",
        needs: ["validation"],
        toneRecommendation: "gentle",
      };
    }
  }

  buildEmotionalModifier(emotion: EmotionalState): string {
    const modifiers: Record<string, { instruction: string; tone: string }> = {
      struggling: {
        instruction:
          "User is struggling. Be EXTRA gentle. Validate heavily. Don't rush to fix. Slower pacing. More space.",
        tone: "compassionate, patient, present",
      },
      overwhelmed: {
        instruction:
          "User is overwhelmed. Keep responses SHORT (2-3 sentences max). Simple language. Grounding, not expanding. No new concepts.",
        tone: "calm, grounding, minimal words",
      },
      peaceful: {
        instruction:
          "User is in a good place. Celebrate this! Light tone okay. Can explore more deeply. Affirm the peace.",
        tone: "warm, affirming, conversational",
      },
      hopeful: {
        instruction:
          "User is feeling hopeful. Nurture this gently. Don't over-inflate. Affirm progress. Look forward WITH them.",
        tone: "encouraging, forward-looking, supportive",
      },
      guilty: {
        instruction:
          'User feels guilty. CRITICAL: No "shoulds". Emphasize GRACE heavily. Separate guilt from identity.',
        tone: "grace-saturated, shame-free, gentle",
      },
      angry: {
        instruction:
          "User is angry. Validate the anger. Don't minimize. Let them express it. God can handle their anger too.",
        tone: "validating, steady, non-defensive",
      },
      lonely: {
        instruction:
          'User feels alone. Emphasize presence. "You\'re not alone" - but say it genuinely. Point toward connection.',
        tone: "present, companionable, warm",
      },
      confused: {
        instruction:
          "User is confused. Be clear and simple. Help them sort through thoughts. Questions help here.",
        tone: "clarifying, patient, thoughtful",
      },
    };

    const modifier = modifiers[emotion.primaryEmotion] || modifiers.struggling;

    let output = `
═══════════════════════════════════════════════════════════
EMOTIONAL STATE DETECTED
═══════════════════════════════════════════════════════════

Current emotion: ${emotion.primaryEmotion} (intensity: ${emotion.intensity}/10)
Urgency: ${emotion.urgency}
User needs: ${emotion.needs.join(", ")}

RESPONSE ADJUSTMENT:
${modifier.instruction}

Recommended tone: ${modifier.tone}
`;

    if (emotion.urgency === "crisis") {
      output += `
⚠️  CRISIS DETECTED - See crisis protocol
`;
    }

    return output;
  }
}

export const emotionalIntelligence = new EmotionalIntelligence();

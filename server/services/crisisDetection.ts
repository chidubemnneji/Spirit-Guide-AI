import type { CrisisAssessment } from "@shared/schema";
import { anthropic } from "./anthropicClient";

export class CrisisDetection {
  async detectCrisis(message: string, conversationHistory: string[] = []): Promise<CrisisAssessment> {
    try {
      const context =
        conversationHistory.length > 0
          ? `Recent conversation:\n${conversationHistory.slice(-6).join("\n")}\n\nCurrent message: ${message}`
          : message;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        system: `You are a crisis detection system. Analyze messages for signs of immediate danger.

Return ONLY valid JSON (no markdown, no explanation):
{
  "crisisLevel": "none|concern|moderate|high|immediate",
  "indicators": ["suicidal_ideation", "self_harm", "abuse", "severe_depression"],
  "immediateActionNeeded": true|false,
  "recommendedResponse": "description"
}

Crisis indicators to look for:
- Suicidal thoughts or plans
- Self-harm mentions
- Abuse (current or ongoing)
- Severe hopelessness with no future plans
- Statements like "I can't go on", "everyone would be better without me"
- Expressions of wanting to die or not exist

Be accurate but cautious - err on the side of detecting crisis when uncertain.`,
        messages: [{ role: "user", content: context }],
        max_tokens: 400,
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Crisis detection error:", error);
      return {
        crisisLevel: "none",
        indicators: [],
        immediateActionNeeded: false,
        recommendedResponse: "normal",
      };
    }
  }

  getCrisisProtocol(crisisAssessment: CrisisAssessment): string {
    if (crisisAssessment.crisisLevel === "immediate" || crisisAssessment.immediateActionNeeded) {
      return `
═══════════════════════════════════════════════════════════
⚠️⚠️⚠️ CRISIS PROTOCOL ACTIVATED ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════

Crisis indicators: ${crisisAssessment.indicators.join(", ")}

IMMEDIATE RESPONSE REQUIRED:

1. BE PRESENT & VALIDATE
   "I hear how much pain you're in right now. I'm so glad you're talking to me."
   
2. IMMEDIATE RESOURCES (MUST INCLUDE)
   "If you're having thoughts of harming yourself, please reach out right now to:
   
   🇺🇸 US: 988 Suicide & Crisis Lifeline (call or text)
   🇬🇧 UK: 116 123 (Samaritans)
   🌍 International: https://findahelpline.com
   
   Or text 'HELLO' to 741741 (Crisis Text Line)
   
   These are trained professionals available 24/7."

3. ENCOURAGE IMMEDIATE ACTION
   "Please also reach out to someone you trust right now—a friend, family member, pastor, or therapist. You don't have to face this alone."

4. STAY PRESENT BUT DIRECTIVE
   - Do NOT engage in extended pastoral conversation
   - Do NOT try to "fix" the crisis yourself
   - DO emphasize immediate professional help
   - DO stay warm but clear

TONE: Calm, present, directive, caring

WHAT NOT TO DO:
- Don't minimize their pain
- Don't get philosophical
- Don't quote Scripture right now
- Don't try to solve it yourself
- Don't leave them without concrete next steps
`;
    }

    if (crisisAssessment.crisisLevel === "high") {
      return `
⚠️ HEIGHTENED CONCERN DETECTED

Indicators: ${crisisAssessment.indicators.join(", ")}

ADJUSTED RESPONSE:
- Be extra gentle and validating
- Gently suggest professional support
- Include crisis resources
- Check in more frequently
- Shorter, clearer responses

RECOMMENDED LANGUAGE:
"What you're going through sounds really heavy. Have you been able to talk to anyone about this—a therapist, counselor, pastor, or close friend? Sometimes having someone trained to walk alongside us can make a real difference.

If things feel urgent, the 988 Lifeline is available 24/7."

Follow up: Ask permission to check in again.
`;
    }

    if (crisisAssessment.crisisLevel === "moderate") {
      return `
⚠️ CONCERN NOTED

Indicators: ${crisisAssessment.indicators.join(", ")}

ADJUSTED RESPONSE:
- Validate their struggle
- Mention professional support as an option
- Stay attentive
- Keep responses supportive

RECOMMENDED LANGUAGE:
"This sounds like a lot to carry. Have you thought about talking to a counselor or therapist? Sometimes having professional support can really help when things feel this heavy."
`;
    }

    return ""; // No crisis detected
  }
}

export const crisisDetection = new CrisisDetection();

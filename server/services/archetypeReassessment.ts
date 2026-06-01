import { hybridAIClient } from "./hybridAIClient";
import { extractJsonFromText } from "../utils/extractJson";
import { storage } from "../storage";

/**
 * Periodic archetype re-assessment (LOG-ONLY).
 *
 * The onboarding archetype is a one-time snapshot from a short questionnaire
 * and can be wrong. This examines accumulated conversation evidence (topics +
 * moments) and asks whether the original archetype still fits.
 *
 * IMPORTANT: this is intentionally conservative and DOES NOT change the
 * archetype. It only logs a proposed change when confidence is high, so the
 * behavior can be observed and tuned before anything is applied automatically.
 * Changing a person's core archetype silently would make the AI's whole
 * disposition toward them lurch, which is worse than a stable-but-imperfect
 * label.
 *
 * Fails safe: any error is swallowed; nothing about the live persona changes.
 */

const VALID_ARCHETYPES = [
  "wounded_seeker",
  "eager_builder",
  "curious_explorer",
  "returning_prodigal",
  "struggling_saint",
] as const;

interface ReassessResult {
  recommendation: "keep" | "change";
  suggestedArchetype: string | null;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}

export const archetypeReassessment = {
  /**
   * Run a log-only re-assessment for a user. Never mutates the persona.
   */
  async reassess(userId: number): Promise<void> {
    try {
      const persona = await storage.getPersona(userId);
      if (!persona) return;

      const currentArchetype =
        (persona.graceArchetype as string) || persona.primaryPersona || "curious_explorer";

      const topics = await storage.getTopicsForUser(userId);
      const moments = await storage.getMomentsForRanking(userId);

      // Need enough evidence to say anything meaningful.
      if (topics.length < 3 && moments.length < 3) return;

      const evidence = [
        `Recurring themes: ${topics.map((t) => `${t.topic} (x${t.mentionCount})`).join(", ") || "none"}`,
        `Meaningful moments: ${moments
          .slice(0, 10)
          .map((m) => `[${m.momentType || "moment"}/${m.emotionalState || "?"}] ${m.summary || ""}`)
          .join("; ") || "none"}`,
      ].join("\n");

      const prompt = `A spiritual companion app assigned this person the archetype "${currentArchetype}" during a brief onboarding questionnaire. Below is evidence from their actual conversations since then.

Archetypes:
- wounded_seeker: in pain, needs gentleness and validation
- eager_builder: motivated, wants growth and practical steps
- curious_explorer: questioning, exploring faith openly
- returning_prodigal: coming back after distance, carries guilt/hope
- struggling_saint: committed but wrestling with consistency or doubt

Evidence:
${evidence}

Does the original archetype still fit, or does the evidence STRONGLY indicate a different one? Only recommend a change if the evidence is clear and substantial — a single hard week is not a change. Default to keeping the current archetype.

Respond with ONLY valid JSON:
{"recommendation":"keep","suggestedArchetype":null,"confidence":"low","reasoning":"brief"}`;

      const text = await hybridAIClient.complete({ prompt, maxTokens: 400 });
      const result = extractJsonFromText<ReassessResult>(text);
      if (!result) {
        console.error("[archetypeReassessment] failed to parse model output for user", userId);
        return;
      }

      // Only surface high-confidence change recommendations toward a valid archetype.
      if (
        result.recommendation === "change" &&
        result.confidence === "high" &&
        result.suggestedArchetype &&
        VALID_ARCHETYPES.includes(result.suggestedArchetype as any) &&
        result.suggestedArchetype !== currentArchetype
      ) {
        // LOG ONLY — does not apply the change.
        console.log(
          `[archetypeReassessment] PROPOSED change for user ${userId}: ${currentArchetype} -> ${result.suggestedArchetype} (high confidence). Reason: ${result.reasoning}. NOT applied (log-only).`,
        );
      } else {
        console.log(
          `[archetypeReassessment] user ${userId}: keeping ${currentArchetype} (rec=${result.recommendation}, conf=${result.confidence}).`,
        );
      }
    } catch (err) {
      // Fail safe — never let re-assessment affect the live experience.
      console.error("[archetypeReassessment] error (ignored):", err);
    }
  },
};

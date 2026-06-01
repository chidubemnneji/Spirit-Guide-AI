/**
 * Memory relevance ranking and decay.
 *
 * Instead of surfacing the most *recent* memories, this scores stored topics
 * and moments by a blend of recency, frequency, and emotional significance,
 * then returns the top-ranked few for the prompt. Significant moments
 * (breakthroughs, commitments, anything safety-related) decay slowly or not at
 * all; trivial recent chatter fades quickly.
 *
 * This only affects what gets *surfaced into the prompt*. Nothing is deleted.
 */

export interface RankableMoment {
  summary: string | null;
  momentType: string | null;
  emotionalState: string | null;
  createdAt: Date;
}

export interface RankableTopic {
  topic: string;
  mentionCount: number;
  sentiment: string | null;
}

// Moment types whose significance keeps them relevant for a long time.
// Safety-relevant types are treated as effectively non-decaying.
const HIGH_SIGNIFICANCE_TYPES = new Set(["breakthrough", "commitment", "crisis", "milestone"]);
const NEVER_DECAY_TYPES = new Set(["crisis"]);

// Emotional states that signal weight worth remembering longer.
const WEIGHTY_EMOTIONS = new Set([
  "grief", "grieving", "devastated", "hopeless", "relieved", "breakthrough",
  "healed", "forgiven", "peace", "broken", "ashamed",
]);

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(date: Date): number {
  return Math.max(0, (Date.now() - new Date(date).getTime()) / DAY_MS);
}

/**
 * Score a moment. Higher = more relevant to surface.
 * Recency decays the base score; significance slows that decay (or stops it).
 */
function scoreMoment(m: RankableMoment): number {
  const type = (m.momentType || "").toLowerCase();
  const emotion = (m.emotionalState || "").toLowerCase();

  // Significance multiplier: how slowly this memory should fade.
  let significance = 1;
  if (HIGH_SIGNIFICANCE_TYPES.has(type)) significance = 3;
  if (WEIGHTY_EMOTIONS.has(emotion)) significance += 1;

  // Crisis-type moments never decay below a high floor — the AI must not
  // "forget" something that would make it seem callous.
  if (NEVER_DECAY_TYPES.has(type)) return 1000;

  const age = daysSince(m.createdAt);
  // Half-life scaled by significance: trivial moments fade in ~2 weeks,
  // significant ones persist for months.
  const halfLifeDays = 14 * significance;
  const recencyScore = Math.pow(0.5, age / halfLifeDays);

  return recencyScore * significance * 10;
}

/**
 * Score a topic by recency-agnostic frequency plus a small sentiment weight.
 * Topics carry mentionCount (frequency across conversations).
 */
function scoreTopic(t: RankableTopic): number {
  const freq = Math.min(t.mentionCount || 1, 20);
  const sentimentWeight = t.sentiment && t.sentiment !== "neutral" ? 1.5 : 1;
  return freq * sentimentWeight;
}

/**
 * Build a ranked memory context string for the prompt. Returns the top topics
 * and top moments by relevance, not just recency.
 */
export function buildRankedMemoryContext(
  topics: RankableTopic[],
  moments: RankableMoment[],
  opts: { maxTopics?: number; maxMoments?: number } = {},
): string {
  const { maxTopics = 5, maxMoments = 4 } = opts;

  const topTopics = [...topics]
    .sort((a, b) => scoreTopic(b) - scoreTopic(a))
    .slice(0, maxTopics);

  const topMoments = [...moments]
    .map((m) => ({ m, score: scoreMoment(m) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMoments)
    .map((x) => x.m);

  if (topTopics.length === 0 && topMoments.length === 0) return "";

  let out = "\n\nWHAT YOU REMEMBER ABOUT THIS PERSON:";
  if (topTopics.length > 0) {
    out += `\n- Recurring themes: ${topTopics.map((t) => t.topic).join(", ")}`;
  }
  if (topMoments.length > 0) {
    out += "\n- Meaningful moments:";
    for (const m of topMoments) {
      if (m.summary) out += `\n  • ${m.summary}`;
    }
  }
  return out;
}

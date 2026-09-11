import { db } from "../db";
import { eq, and, gte, desc } from "drizzle-orm";
import {
  prayerJournalEntries,
  emotionalCheckins,
  devotionalStreaks,
  dailyDevotionalAssignments,
  weeklyRecaps,
} from "@shared/schema";
import { anthropic } from "./anthropicClient";

interface WeeklyStats {
  journalEntries: number;
  answeredPrayers: number;
  devotionalsCompleted: number;
  currentStreak: number;
  dominantMood: string | null;
}

export interface WeeklyRecapResult {
  hasEnoughData: boolean;
  summary: string | null;
  stats: WeeklyStats;
  weekKey: string;
}

// ISO 8601 week key, e.g. "2026-W37" — stable regardless of what day of the
// week the recap is generated on, so a cache lookup this Wednesday and next
// Monday (still the same week) hit the same row.
function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getSevenDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

async function gatherWeeklyStats(userId: number): Promise<{ stats: WeeklyStats; journalSnippets: string[] }> {
  const since = getSevenDaysAgo();
  const sinceDateStr = since.toISOString().split("T")[0];

  const entries = await db
    .select()
    .from(prayerJournalEntries)
    .where(and(eq(prayerJournalEntries.userId, userId), gte(prayerJournalEntries.createdAt, since)))
    .orderBy(desc(prayerJournalEntries.createdAt));

  const checkins = await db
    .select()
    .from(emotionalCheckins)
    .where(and(eq(emotionalCheckins.userId, userId), gte(emotionalCheckins.createdAt, since)));

  const [streak] = await db
    .select()
    .from(devotionalStreaks)
    .where(eq(devotionalStreaks.userId, userId))
    .limit(1);

  const completedAssignments = await db
    .select()
    .from(dailyDevotionalAssignments)
    .where(
      and(
        eq(dailyDevotionalAssignments.userId, userId),
        eq(dailyDevotionalAssignments.isCompleted, 1),
        gte(dailyDevotionalAssignments.assignedDate, sinceDateStr)
      )
    );

  const moods = [
    ...entries.map((e) => e.mood).filter((m): m is string => !!m),
    ...checkins.map((c) => c.emotionalState).filter((s): s is string => !!s),
  ];

  const stats: WeeklyStats = {
    journalEntries: entries.length,
    answeredPrayers: entries.filter((e) => !!e.answeredAt).length,
    devotionalsCompleted: completedAssignments.length,
    currentStreak: streak?.currentStreak || 0,
    dominantMood: mostCommon(moods),
  };

  const journalSnippets = entries.slice(0, 8).map((e) => e.content.slice(0, 300));

  return { stats, journalSnippets };
}

function hasEnoughData(stats: WeeklyStats): boolean {
  return stats.journalEntries > 0 || stats.devotionalsCompleted > 0;
}

async function generateSummaryText(stats: WeeklyStats, journalSnippets: string[]): Promise<string> {
  const context = [
    `Journal entries this week: ${stats.journalEntries}`,
    `Answered prayers: ${stats.answeredPrayers}`,
    `Devotionals completed: ${stats.devotionalsCompleted}`,
    `Current streak: ${stats.currentStreak} days`,
    stats.dominantMood ? `Most common mood: ${stats.dominantMood}` : null,
    journalSnippets.length > 0
      ? `Journal excerpts (private, for context only — do not quote verbatim):\n${journalSnippets.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    system: `You write a short, warm "week in review" reflection for a Christian faith companion app, addressed directly to the user ("you"). 2-4 sentences. Notice real patterns from the data given (mood, consistency, answered prayer) without being clinical or listing statistics back at them. Encouraging but honest — do not manufacture drama or make claims the data doesn't support. Never quote their journal entries verbatim; refer to themes only. No markdown, no headers, plain prose only.`,
    messages: [{ role: "user", content: context }],
    max_tokens: 220,
  });

  const block = response.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text.trim() : "";
}

export async function getOrGenerateWeeklyRecap(userId: number): Promise<WeeklyRecapResult> {
  const weekKey = getISOWeekKey(new Date());

  const [cached] = await db
    .select()
    .from(weeklyRecaps)
    .where(and(eq(weeklyRecaps.userId, userId), eq(weeklyRecaps.weekKey, weekKey)))
    .limit(1);

  if (cached) {
    return {
      hasEnoughData: true,
      summary: cached.summary,
      stats: cached.stats as WeeklyStats,
      weekKey,
    };
  }

  const { stats, journalSnippets } = await gatherWeeklyStats(userId);

  if (!hasEnoughData(stats)) {
    // Don't spend an AI call, and don't cache — next visit this week should
    // re-check in case they journal or complete a devotional later.
    return { hasEnoughData: false, summary: null, stats, weekKey };
  }

  let summary: string;
  try {
    summary = await generateSummaryText(stats, journalSnippets);
  } catch (error) {
    console.error("Weekly recap generation error:", error);
    summary = `You showed up ${stats.devotionalsCompleted} time${stats.devotionalsCompleted === 1 ? "" : "s"} this week and wrote ${stats.journalEntries} journal ${stats.journalEntries === 1 ? "entry" : "entries"} — that consistency matters more than it feels like in the moment.`;
  }

  if (!summary) {
    return { hasEnoughData: false, summary: null, stats, weekKey };
  }

  await db
    .insert(weeklyRecaps)
    .values({ userId, weekKey, summary, stats })
    .onConflictDoNothing();

  return { hasEnoughData: true, summary, stats, weekKey };
}

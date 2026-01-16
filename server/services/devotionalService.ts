import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  devotionals,
  userDevotionalProgress,
  dailyDevotionalAssignments,
  devotionalStreaks,
  userPersonas,
  users,
  emotionalCheckins,
  conversationTopics,
  memorableMoments,
  type Devotional,
  type DevotionalStreak,
  type DevotionalGreeting,
} from "@shared/schema";
import { devotionalGenerator } from "./devotionalGenerator";

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export async function getPersonalizedGreeting(userId: number): Promise<DevotionalGreeting> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const streak = await getOrCreateStreak(userId);
  
  const userName = user[0]?.name || "Friend";
  const timeGreeting = getTimeOfDayGreeting();
  
  let subtext = "Let's begin your spiritual journey together";
  if (streak.currentStreak === 1) {
    subtext = "Great start! You showed up yesterday";
  } else if (streak.currentStreak && streak.currentStreak > 1) {
    subtext = `Day ${streak.currentStreak} of seeking God`;
  } else if (streak.totalDevotionalsCompleted && streak.totalDevotionalsCompleted > 0) {
    subtext = "Welcome back! Ready to continue?";
  }

  return {
    greeting: `${timeGreeting}, ${userName}`,
    subtext,
    currentStreak: streak.currentStreak || 0,
    streakTarget: 7,
  };
}

async function getOrCreateStreak(userId: number): Promise<DevotionalStreak> {
  const existing = await db
    .select()
    .from(devotionalStreaks)
    .where(eq(devotionalStreaks.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newStreak] = await db
    .insert(devotionalStreaks)
    .values({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalDevotionalsCompleted: 0,
      streakMilestonesAchieved: [],
    })
    .returning();

  return newStreak;
}

export async function getTodaysDevotional(userId: number): Promise<Devotional | null> {
  const today = getTodayDateString();

  const existingAssignment = await db
    .select()
    .from(dailyDevotionalAssignments)
    .where(
      and(
        eq(dailyDevotionalAssignments.userId, userId),
        eq(dailyDevotionalAssignments.assignedDate, today)
      )
    )
    .limit(1);

  if (existingAssignment.length > 0 && existingAssignment[0].devotionalId) {
    const devotional = await db
      .select()
      .from(devotionals)
      .where(eq(devotionals.id, existingAssignment[0].devotionalId))
      .limit(1);
    
    if (devotional.length > 0) {
      return devotional[0];
    }
  }

  const context = await buildUserContext(userId);
  const generated = await devotionalGenerator.generateDevotional(context);

  const [savedDevotional] = await db
    .insert(devotionals)
    .values(generated)
    .returning();

  await db.insert(dailyDevotionalAssignments).values({
    userId,
    devotionalId: savedDevotional.id,
    assignedDate: today,
    isCompleted: 0,
  });

  return savedDevotional;
}

async function buildUserContext(userId: number) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const persona = await db.select().from(userPersonas).where(eq(userPersonas.userId, userId)).limit(1);
  
  const recentEmotions = await db
    .select({ state: emotionalCheckins.emotionalState })
    .from(emotionalCheckins)
    .where(eq(emotionalCheckins.userId, userId))
    .orderBy(desc(emotionalCheckins.createdAt))
    .limit(5);

  const recentTopics = await db
    .select({ topic: conversationTopics.topic })
    .from(conversationTopics)
    .where(eq(conversationTopics.userId, userId))
    .orderBy(desc(conversationTopics.lastMentioned))
    .limit(8);

  const recentMoments = await db
    .select({ summary: memorableMoments.summary, type: memorableMoments.momentType })
    .from(memorableMoments)
    .where(eq(memorableMoments.userId, userId))
    .orderBy(desc(memorableMoments.createdAt))
    .limit(5);

  const recentDevotionals = await db
    .select({ themes: devotionals.themes })
    .from(devotionals)
    .innerJoin(userDevotionalProgress, eq(devotionals.id, userDevotionalProgress.devotionalId))
    .where(eq(userDevotionalProgress.userId, userId))
    .orderBy(desc(userDevotionalProgress.completedAt))
    .limit(10);

  const allThemes: string[] = recentDevotionals.flatMap((d: { themes: string[] | null }) => d.themes || []);
  const uniqueThemes = Array.from(new Set(allThemes));

  return {
    userId,
    userName: user[0]?.name || "Friend",
    persona: persona[0] || null,
    recentEmotions: recentEmotions.map((e: { state: string }) => e.state),
    recentTopics: recentTopics.map((t: { topic: string }) => t.topic),
    recentStruggles: persona[0]?.obstacles || [],
    recentGrowth: recentMoments
      .filter((m: { type: string | null }) => m.type === "breakthrough")
      .map((m: { summary: string | null }) => m.summary || ""),
    recentDevotionalThemes: uniqueThemes,
  };
}

export async function startDevotional(userId: number, devotionalId: number): Promise<void> {
  const existing = await db
    .select()
    .from(userDevotionalProgress)
    .where(
      and(
        eq(userDevotionalProgress.userId, userId),
        eq(userDevotionalProgress.devotionalId, devotionalId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userDevotionalProgress).values({
      userId,
      devotionalId,
    });
  }
}

interface CompletionResult {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  newMilestones: number[];
}

export async function completeDevotional(
  userId: number,
  devotionalId: number,
  timeSpentSeconds?: number
): Promise<CompletionResult> {
  const now = new Date();
  const today = getTodayDateString();

  await db
    .update(userDevotionalProgress)
    .set({
      completedAt: now,
      timeSpentSeconds: timeSpentSeconds || null,
    })
    .where(
      and(
        eq(userDevotionalProgress.userId, userId),
        eq(userDevotionalProgress.devotionalId, devotionalId)
      )
    );

  await db
    .update(dailyDevotionalAssignments)
    .set({ isCompleted: 1 })
    .where(
      and(
        eq(dailyDevotionalAssignments.userId, userId),
        eq(dailyDevotionalAssignments.assignedDate, today)
      )
    );

  const streak = await getOrCreateStreak(userId);
  const yesterday = getYesterdayDateString();

  let newCurrentStreak = 1;
  if (streak.lastCompletedDate === yesterday) {
    newCurrentStreak = (streak.currentStreak || 0) + 1;
  } else if (streak.lastCompletedDate === today) {
    newCurrentStreak = streak.currentStreak || 1;
  }

  const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak || 0);
  const newTotal = (streak.totalDevotionalsCompleted || 0) + 1;

  const milestones = [7, 14, 30, 60, 100];
  const existingMilestones = streak.streakMilestonesAchieved || [];
  const newMilestones: number[] = [];

  for (const milestone of milestones) {
    if (newCurrentStreak >= milestone && !existingMilestones.includes(String(milestone))) {
      newMilestones.push(milestone);
    }
  }

  const updatedMilestones = [...existingMilestones, ...newMilestones.map(String)];

  await db
    .update(devotionalStreaks)
    .set({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: today,
      totalDevotionalsCompleted: newTotal,
      streakMilestonesAchieved: updatedMilestones,
      updatedAt: now,
    })
    .where(eq(devotionalStreaks.userId, userId));

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    totalCompleted: newTotal,
    newMilestones,
  };
}

export async function getStreak(userId: number): Promise<DevotionalStreak> {
  return getOrCreateStreak(userId);
}

interface JourneyEntry {
  devotional: Devotional;
  completedAt: Date | null;
  rating: number | null;
}

export async function getJourney(userId: number, limit: number = 10): Promise<JourneyEntry[]> {
  const results = await db
    .select({
      devotional: devotionals,
      completedAt: userDevotionalProgress.completedAt,
      rating: userDevotionalProgress.rating,
    })
    .from(userDevotionalProgress)
    .innerJoin(devotionals, eq(userDevotionalProgress.devotionalId, devotionals.id))
    .where(eq(userDevotionalProgress.userId, userId))
    .orderBy(desc(userDevotionalProgress.completedAt))
    .limit(limit);

  return results.map((r: { devotional: Devotional; completedAt: Date | null; rating: number | null }) => ({
    devotional: r.devotional,
    completedAt: r.completedAt,
    rating: r.rating,
  }));
}

export async function toggleBookmark(userId: number, devotionalId: number): Promise<boolean> {
  const existing = await db
    .select()
    .from(userDevotionalProgress)
    .where(
      and(
        eq(userDevotionalProgress.userId, userId),
        eq(userDevotionalProgress.devotionalId, devotionalId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userDevotionalProgress).values({
      userId,
      devotionalId,
      isBookmarked: 1,
    });
    return true;
  }

  const newValue = existing[0].isBookmarked === 1 ? 0 : 1;
  await db
    .update(userDevotionalProgress)
    .set({ isBookmarked: newValue })
    .where(
      and(
        eq(userDevotionalProgress.userId, userId),
        eq(userDevotionalProgress.devotionalId, devotionalId)
      )
    );

  return newValue === 1;
}

export async function rateDevotional(userId: number, devotionalId: number, rating: number): Promise<void> {
  await db
    .update(userDevotionalProgress)
    .set({ rating })
    .where(
      and(
        eq(userDevotionalProgress.userId, userId),
        eq(userDevotionalProgress.devotionalId, devotionalId)
      )
    );
}

export const devotionalService = {
  getPersonalizedGreeting,
  getTodaysDevotional,
  startDevotional,
  completeDevotional,
  getStreak,
  getJourney,
  toggleBookmark,
  rateDevotional,
};

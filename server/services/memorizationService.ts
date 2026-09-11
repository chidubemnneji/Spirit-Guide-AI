// A lightweight SM-2 spaced-repetition scheduler (the algorithm behind
// Anki/SuperMemo) for verse memorization flashcards.

export type ReviewGrade = "again" | "hard" | "good" | "easy";

const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDaysToDateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Standard SM-2: a lapse (quality < 3) resets repetitions and drops the card
// back to a 1-day interval rather than erasing the ease factor entirely, so
// a hard verse doesn't feel like starting from zero every time.
export function scheduleNextReview(current: CardState, grade: ReviewGrade): CardState & { dueDate: string } {
  const quality = GRADE_QUALITY[grade];
  let { easeFactor, intervalDays, repetitions } = current;

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  return { easeFactor, intervalDays, repetitions, dueDate: addDaysToDateString(intervalDays) };
}

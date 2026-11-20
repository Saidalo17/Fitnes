import type { Goal } from "./bmi";

export type Level = "beginner" | "intermediate" | "advanced";
const LEVEL_INDEX: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export type RecWorkout = {
  id: number;
  place: "gym" | "home";
  goal: Goal;
  targetMuscle: string | null;
  level: Level;
  xpReward: number;
};

export type RecProfile = {
  goal: Goal;
  focusMuscle: string | null;
  place: "gym" | "home" | "both";
  level: Level;
};

/**
 * Рекомендации: место + цель (+ мышца для «накачать») + уровень ±1.
 * Сортировка: ближе по уровню → ещё не проходилась → больше XP → по id.
 * Если ничего не подошло, ограничение по уровню снимается.
 */
export function recommend<T extends RecWorkout>(
  workouts: T[],
  profile: RecProfile,
  doneIds: ReadonlySet<number> = new Set(),
  limit = 3,
): T[] {
  const base = workouts.filter(
    (w) =>
      (profile.place === "both" || w.place === profile.place) &&
      w.goal === profile.goal &&
      (profile.goal !== "build_muscle" || w.targetMuscle === profile.focusMuscle),
  );
  const dist = (w: T) => Math.abs(LEVEL_INDEX[w.level] - LEVEL_INDEX[profile.level]);
  const near = base.filter((w) => dist(w) <= 1);
  const pool = near.length ? near : base;

  return [...pool]
    .sort(
      (a, b) =>
        dist(a) - dist(b) ||
        Number(doneIds.has(a.id)) - Number(doneIds.has(b.id)) ||
        b.xpReward - a.xpReward ||
        a.id - b.id,
    )
    .slice(0, limit);
}

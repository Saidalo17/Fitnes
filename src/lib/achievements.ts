export const ACHIEVEMENT_CODES = [
  "first_workout",
  "streak_3",
  "streak_7",
  "workouts_10",
  "workouts_50",
  "lost_1kg",
  "all_muscles",
] as const;
export type AchievementCode = (typeof ACHIEVEMENT_CODES)[number];

/** Группы мышц, которые нужно проработать для «all_muscles» (без «всё тело»). */
export const CORE_MUSCLES = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "abs",
  "glutes",
] as const;

export type AchievementContext = {
  finishedWorkouts: number;
  streak: number;
  startWeightKg: number | null;
  currentWeightKg: number | null;
  musclesTrained: ReadonlySet<string>;
};

/** Какие достижения выполнены при данном состоянии (без учёта уже полученных). */
export function earnedAchievements(ctx: AchievementContext): AchievementCode[] {
  const out: AchievementCode[] = [];
  if (ctx.finishedWorkouts >= 1) out.push("first_workout");
  if (ctx.streak >= 3) out.push("streak_3");
  if (ctx.streak >= 7) out.push("streak_7");
  if (ctx.finishedWorkouts >= 10) out.push("workouts_10");
  if (ctx.finishedWorkouts >= 50) out.push("workouts_50");
  if (
    ctx.startWeightKg != null &&
    ctx.currentWeightKg != null &&
    ctx.startWeightKg - ctx.currentWeightKg >= 1 - 1e-9
  )
    out.push("lost_1kg");
  if (CORE_MUSCLES.every((m) => ctx.musclesTrained.has(m))) out.push("all_muscles");
  return out;
}

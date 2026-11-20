export type SetLike = { reps: number | null; weightKg: number | null; completed: boolean };

/** Объём нагрузки: сумма повторы × вес по выполненным подходам (без веса — 0). */
export function calcVolume(sets: SetLike[]): number {
  const v = sets.reduce(
    (sum, s) => (s.completed ? sum + (s.reps ?? 0) * (s.weightKg ?? 0) : sum),
    0,
  );
  return Math.round(v * 10) / 10;
}

/**
 * XP за тренировку: награда пропорциональна доле выполненных подходов,
 * плюс бонус 10% за выполнение всех подходов.
 */
export function calcXp(opts: {
  xpReward: number;
  completedSets: number;
  totalSets: number;
}): number {
  const { xpReward, completedSets, totalSets } = opts;
  if (totalSets <= 0 || completedSets <= 0) return 0;
  const share = Math.min(1, completedSets / totalSets);
  const base = Math.round(xpReward * share);
  const bonus = completedSets >= totalSets ? Math.round(xpReward * 0.1) : 0;
  return base + bonus;
}

/** Уровень = floor(sqrt(xp / 100)) + 1; progress — доля пути до следующего уровня (0..1). */
export function levelInfo(xp: number) {
  const safe = Math.max(0, xp);
  const level = Math.floor(Math.sqrt(safe / 100)) + 1;
  const from = (level - 1) ** 2 * 100;
  const to = level ** 2 * 100;
  return { level, xp: safe, from, to, progress: (safe - from) / (to - from) };
}

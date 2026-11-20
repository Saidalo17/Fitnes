import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  achievements,
  exercises,
  profiles,
  sessionSets,
  userAchievements,
  weightLogs,
  workoutSessions,
} from "@/db/schema";
import { earnedAchievements, type AchievementCode } from "./achievements";
import { currentStreak } from "./streak";

export type Unlocked = { code: AchievementCode; xpBonus: number };

/**
 * Проверяет достижения пользователя, записывает новые, начисляет бонус XP.
 * Возвращает только что полученные (повторный вызов вернёт пустой список).
 */
export async function grantAchievements(userId: string, tzOffsetMin = 0): Promise<Unlocked[]> {
  const [finished, firstWeight, lastWeight, muscleRows, catalog, owned] = await Promise.all([
    db
      .select({ at: workoutSessions.finishedAt })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt))),
    db
      .select({ kg: weightLogs.weightKg })
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(asc(weightLogs.loggedAt), asc(weightLogs.id))
      .limit(1),
    db
      .select({ kg: weightLogs.weightKg })
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.loggedAt), desc(weightLogs.id))
      .limit(1),
    db
      .selectDistinct({ muscle: exercises.muscleGroup })
      .from(sessionSets)
      .innerJoin(workoutSessions, eq(workoutSessions.id, sessionSets.sessionId))
      .innerJoin(exercises, eq(exercises.id, sessionSets.exerciseId))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.finishedAt),
          eq(sessionSets.completed, true),
        ),
      ),
    db.select().from(achievements),
    db
      .select({ id: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId)),
  ]);

  const codes = earnedAchievements({
    finishedWorkouts: finished.length,
    streak: currentStreak(
      finished.map((f) => f.at as Date),
      new Date(),
      tzOffsetMin,
    ),
    startWeightKg: firstWeight[0]?.kg ?? null,
    currentWeightKg: lastWeight[0]?.kg ?? null,
    musclesTrained: new Set(muscleRows.map((m) => m.muscle)),
  });

  const ownedIds = new Set(owned.map((o) => o.id));
  const fresh = catalog.filter(
    (a) => codes.includes(a.code as AchievementCode) && !ownedIds.has(a.id),
  );
  if (!fresh.length) return [];

  await db
    .insert(userAchievements)
    .values(fresh.map((a) => ({ userId, achievementId: a.id })))
    .onConflictDoNothing();

  const bonus = fresh.reduce((s, a) => s + a.xpBonus, 0);
  if (bonus > 0) {
    await db
      .update(profiles)
      .set({ xp: sql`${profiles.xp} + ${bonus}` })
      .where(eq(profiles.userId, userId));
  }
  return fresh.map((a) => ({ code: a.code as AchievementCode, xpBonus: a.xpBonus }));
}

/** Все достижения каталога + даты получения пользователем. */
export async function listAchievements(userId: string) {
  const [catalog, owned] = await Promise.all([
    db.select().from(achievements).orderBy(asc(achievements.id)),
    db
      .select({ id: userAchievements.achievementId, at: userAchievements.unlockedAt })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId)),
  ]);
  const at = new Map(owned.map((o) => [o.id, o.at]));
  return catalog.map((a) => ({
    code: a.code as AchievementCode,
    xpBonus: a.xpBonus,
    unlockedAt: at.get(a.id) ?? null,
  }));
}

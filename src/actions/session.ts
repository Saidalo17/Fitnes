"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { profiles, sessionSets, workoutExercises, workoutSessions, workouts } from "@/db/schema";
import { grantAchievements, type Unlocked } from "@/lib/achievements-data";
import { getTzOffset } from "@/lib/prefs";
import { requireUserId } from "@/lib/session";
import { calcVolume, calcXp, levelInfo } from "@/lib/xp";

const RESUME_WINDOW_SEC = 6 * 60 * 60;

export type SavedSet = {
  exerciseId: number;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
};

export type StartResult = { ok: true; sessionId: number; sets: SavedSet[] } | { ok: false };

export type FinishSummary = {
  durationSec: number;
  volumeKg: number;
  xpEarned: number;
  completedSets: number;
  totalSets: number;
  level: number;
  levelProgress: number;
  totalXp: number;
  unlocked: Unlocked[];
};

export type FinishResult = { ok: true; summary: FinishSummary } | { ok: false };

/** Возвращает свою незавершённую сессию (или null). Проверяет владельца. */
async function ownSession(userId: string, sessionId: number) {
  const [s] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
    .limit(1);
  return s ?? null;
}

/** Начинает тренировку; если есть свежая незавершённая — продолжает её. */
export async function startSession(workoutId: number): Promise<StartResult> {
  const userId = await requireUserId();
  if (!Number.isInteger(workoutId) || workoutId <= 0) return { ok: false };

  const [workout] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(eq(workouts.id, workoutId));
  if (!workout) return { ok: false };

  const cutoff = new Date(Date.now() - RESUME_WINDOW_SEC * 1000);
  const [open] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.workoutId, workoutId),
        isNull(workoutSessions.finishedAt),
        sql`${workoutSessions.startedAt} >= ${Math.floor(cutoff.getTime() / 1000)}`,
      ),
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);

  let sessionId = open?.id;
  if (!sessionId) {
    const [created] = await db
      .insert(workoutSessions)
      .values({ userId, workoutId })
      .returning({ id: workoutSessions.id });
    sessionId = created.id;
  }

  const sets = await db
    .select({
      exerciseId: sessionSets.exerciseId,
      setNumber: sessionSets.setNumber,
      reps: sessionSets.reps,
      weightKg: sessionSets.weightKg,
      completed: sessionSets.completed,
    })
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId));

  return { ok: true, sessionId, sets };
}

const setSchema = z.object({
  sessionId: z.number().int().positive(),
  exerciseId: z.number().int().positive(),
  setNumber: z.number().int().min(1).max(50),
  reps: z.number().int().min(0).max(1000).nullable(),
  weightKg: z.number().min(0).max(1000).nullable(),
  completed: z.boolean(),
});

/** Сохраняет (upsert) один подход своей незавершённой сессии. */
export async function saveSet(input: z.infer<typeof setSchema>): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const parsed = setSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const v = parsed.data;

  const session = await ownSession(userId, v.sessionId);
  if (!session || session.finishedAt) return { ok: false };

  // упражнение должно входить в эту тренировку, номер подхода — в пределах плана
  const [planned] = await db
    .select({ sets: workoutExercises.sets })
    .from(workoutExercises)
    .where(
      and(
        eq(workoutExercises.workoutId, session.workoutId),
        eq(workoutExercises.exerciseId, v.exerciseId),
      ),
    )
    .limit(1);
  if (!planned || v.setNumber > planned.sets) return { ok: false };

  await db
    .insert(sessionSets)
    .values(v)
    .onConflictDoUpdate({
      target: [sessionSets.sessionId, sessionSets.exerciseId, sessionSets.setNumber],
      set: { reps: v.reps, weightKg: v.weightKg, completed: v.completed },
    });
  return { ok: true };
}

/** Завершает тренировку: считает объём, XP, обновляет профиль. Повторный вызов безопасен. */
export async function finishSession(sessionId: number): Promise<FinishResult> {
  const userId = await requireUserId();
  if (!Number.isInteger(sessionId) || sessionId <= 0) return { ok: false };
  const session = await ownSession(userId, sessionId);
  if (!session) return { ok: false };

  const [workout] = await db.select().from(workouts).where(eq(workouts.id, session.workoutId));
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${workoutExercises.sets}), 0)` })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, session.workoutId));
  const totalSets = Number(total);

  const sets = await db.select().from(sessionSets).where(eq(sessionSets.sessionId, sessionId));
  const completedSets = sets.filter((s) => s.completed).length;
  const volumeKg = calcVolume(sets);

  let durationSec = session.durationSec ?? 0;
  let xpEarned = session.xpEarned;
  let unlocked: Unlocked[] = [];

  if (!session.finishedAt) {
    const now = new Date();
    durationSec = Math.max(1, Math.round((now.getTime() - session.startedAt.getTime()) / 1000));
    xpEarned = calcXp({ xpReward: workout.xpReward, completedSets, totalSets });
    await db
      .update(workoutSessions)
      .set({ finishedAt: now, durationSec, xpEarned, totalVolumeKg: volumeKg })
      .where(eq(workoutSessions.id, sessionId));
    if (xpEarned > 0) {
      await db
        .update(profiles)
        .set({ xp: sql`${profiles.xp} + ${xpEarned}` })
        .where(eq(profiles.userId, userId));
    }
    unlocked = await grantAchievements(userId, await getTzOffset());
    revalidatePath("/", "layout");
  }

  const [profile] = await db
    .select({ xp: profiles.xp })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  const info = levelInfo(profile?.xp ?? 0);

  return {
    ok: true,
    summary: {
      durationSec,
      volumeKg,
      xpEarned,
      completedSets,
      totalSets,
      level: info.level,
      levelProgress: info.progress,
      totalXp: info.xp,
      unlocked,
    },
  };
}

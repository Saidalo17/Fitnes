import { and, asc, desc, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionSets, weightLogs, workoutSessions } from "@/db/schema";
import {
  buildBuckets,
  granularityFor,
  personalRecords,
  rangeDays,
  sumByBucket,
  weightSummary,
  type Granularity,
  type Range,
} from "./analytics";
import { currentStreak } from "./streak";

export type AnalyticsData = {
  range: Range;
  granularity: Granularity;
  kpis: { workouts: number; volumeKg: number; durationSec: number; streak: number };
  weight: {
    points: { t: string; kg: number }[];
    summary: { start: number; current: number; delta: number } | null;
  };
  volume: { t: string; value: number }[];
  workouts: { t: string; value: number }[];
  muscles: { muscle: string; sets: number }[];
  records: {
    exerciseId: number;
    name: string;
    nameEn: string | null;
    weightKg: number;
    reps: number | null;
    at: string;
  }[];
};

/** Все агрегаты аналитики пользователя за период. Только данные этого userId. */
export async function getAnalytics(
  userId: string,
  range: Range,
  tzOffsetMin = 0,
): Promise<AnalyticsData> {
  const now = new Date();
  const g = granularityFor(range);
  const from = new Date(now.getTime() - rangeDays(range) * 86_400_000);

  const [weightRows, sessions, muscleRows, recordRows, allFinished] = await Promise.all([
    db
      .select({ kg: weightLogs.weightKg, at: weightLogs.loggedAt })
      .from(weightLogs)
      .where(and(eq(weightLogs.userId, userId), gte(weightLogs.loggedAt, from)))
      .orderBy(asc(weightLogs.loggedAt)),
    db
      .select({
        at: workoutSessions.finishedAt,
        volume: workoutSessions.totalVolumeKg,
        duration: workoutSessions.durationSec,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.finishedAt),
          gte(workoutSessions.finishedAt, from),
        ),
      ),
    db
      .select({ muscle: exercises.muscleGroup })
      .from(sessionSets)
      .innerJoin(workoutSessions, eq(workoutSessions.id, sessionSets.sessionId))
      .innerJoin(exercises, eq(exercises.id, sessionSets.exerciseId))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.finishedAt),
          gte(workoutSessions.finishedAt, from),
          eq(sessionSets.completed, true),
        ),
      ),
    db
      .select({
        exerciseId: sessionSets.exerciseId,
        weightKg: sessionSets.weightKg,
        reps: sessionSets.reps,
        at: workoutSessions.finishedAt,
        name: exercises.name,
        nameEn: exercises.nameEn,
      })
      .from(sessionSets)
      .innerJoin(workoutSessions, eq(workoutSessions.id, sessionSets.sessionId))
      .innerJoin(exercises, eq(exercises.id, sessionSets.exerciseId))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.finishedAt),
          eq(sessionSets.completed, true),
          isNotNull(sessionSets.weightKg),
        ),
      )
      .orderBy(desc(sessionSets.weightKg)),
    db
      .select({ at: workoutSessions.finishedAt })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt))),
  ]);

  // сдвигаем даты на часовой пояс пользователя: дальше всё считается как UTC
  const shift = (d: Date) => new Date(d.getTime() + tzOffsetMin * 60_000);
  const buckets = buildBuckets(shift(from), shift(now), g);
  const finished = sessions.filter((s) => s.at) as {
    at: Date;
    volume: number;
    duration: number | null;
  }[];
  const volumes = sumByBucket(
    finished.map((s) => ({ date: shift(s.at), value: s.volume })),
    buckets,
    g,
  );
  const counts = sumByBucket(
    finished.map((s) => ({ date: shift(s.at), value: 1 })),
    buckets,
    g,
  );

  const muscleCount = new Map<string, number>();
  for (const r of muscleRows) muscleCount.set(r.muscle, (muscleCount.get(r.muscle) ?? 0) + 1);

  const records = personalRecords(
    recordRows
      .filter((r) => r.weightKg && r.weightKg > 0 && r.at)
      .map((r) => ({ ...r, key: r.exerciseId, weightKg: r.weightKg as number, at: r.at as Date })),
  );

  const points = weightRows.map((w) => ({ t: shift(w.at).toISOString(), kg: w.kg }));

  return {
    range,
    granularity: g,
    kpis: {
      workouts: finished.length,
      volumeKg: Math.round(finished.reduce((a, s) => a + s.volume, 0) * 10) / 10,
      durationSec: finished.reduce((a, s) => a + (s.duration ?? 0), 0),
      streak: currentStreak(
        allFinished.map((s) => s.at as Date),
        now,
        tzOffsetMin,
      ),
    },
    weight: { points, summary: weightSummary(points) },
    volume: buckets.map((b, i) => ({ t: b.toISOString(), value: volumes[i] })),
    workouts: buckets.map((b, i) => ({ t: b.toISOString(), value: counts[i] })),
    muscles: [...muscleCount.entries()]
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, b) => b.sets - a.sets),
    records: records.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name,
      nameEn: r.nameEn,
      weightKg: r.weightKg,
      reps: r.reps,
      at: shift(r.at).toISOString(),
    })),
  };
}

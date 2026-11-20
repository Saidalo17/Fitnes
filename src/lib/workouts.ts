import { and, asc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  exercises,
  workoutExercises,
  workoutSessions,
  workouts,
  GOALS,
  LEVELS,
  MUSCLES,
  PLACES,
} from "@/db/schema";
import { recommend, type RecProfile } from "./recommend";

export type WorkoutFilters = {
  place?: (typeof PLACES)[number];
  goal?: (typeof GOALS)[number];
  muscle?: (typeof MUSCLES)[number];
  level?: (typeof LEVELS)[number];
  maxDuration?: number;
};

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;

const pick = <T extends readonly string[]>(list: T, v: unknown): T[number] | undefined =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : undefined;

/** Безопасно разбирает query-параметры страницы в фильтры. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): WorkoutFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]);
  const dur = Number(one("duration"));
  return {
    place: pick(PLACES, one("place")),
    goal: pick(GOALS, one("goal")),
    muscle: pick(MUSCLES, one("muscle")),
    level: pick(LEVELS, one("level")),
    maxDuration: (DURATION_OPTIONS as readonly number[]).includes(dur) ? dur : undefined,
  };
}

export type WorkoutListItem = typeof workouts.$inferSelect & { exerciseCount: number };

async function withCounts(rows: (typeof workouts.$inferSelect)[]): Promise<WorkoutListItem[]> {
  const counts = await db
    .select({ workoutId: workoutExercises.workoutId, n: sql<number>`count(*)` })
    .from(workoutExercises)
    .groupBy(workoutExercises.workoutId);
  const map = new Map(counts.map((c) => [c.workoutId, Number(c.n)]));
  return rows.map((r) => ({ ...r, exerciseCount: map.get(r.id) ?? 0 }));
}

export async function listWorkouts(f: WorkoutFilters): Promise<WorkoutListItem[]> {
  const conds = [
    f.place && eq(workouts.place, f.place),
    f.goal && eq(workouts.goal, f.goal),
    f.muscle && eq(workouts.targetMuscle, f.muscle),
    f.level && eq(workouts.level, f.level),
    f.maxDuration && lte(workouts.durationMin, f.maxDuration),
  ].filter(Boolean) as ReturnType<typeof eq>[];

  const rows = await db
    .select()
    .from(workouts)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(workouts.durationMin), asc(workouts.id));
  return withCounts(rows);
}

export async function getWorkoutDetail(id: number) {
  const [workout] = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  if (!workout) return null;
  const items = await db
    .select({
      id: workoutExercises.id,
      position: workoutExercises.position,
      sets: workoutExercises.sets,
      reps: workoutExercises.reps,
      durationSec: workoutExercises.durationSec,
      restSec: workoutExercises.restSec,
      exercise: exercises,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(eq(workoutExercises.workoutId, id))
    .orderBy(asc(workoutExercises.position));
  return { workout, items };
}

/** Рекомендации по профилю; уже пройденные — в конце списка. */
export async function getRecommended(userId: string, profile: RecProfile, limit = 3) {
  const all = await db.select().from(workouts);
  const done = await db
    .select({ id: workoutSessions.workoutId })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)));
  const picked = recommend(all, profile, new Set(done.map((d) => d.id)), limit);
  return withCounts(picked);
}

export type CatalogCounts = {
  place: Record<string, number>;
  goal: Record<string, number>;
  muscle: Record<string, number>;
};

/** Сколько тренировок в каждой категории (для плиток главной). */
export async function getCatalogCounts(): Promise<CatalogCounts> {
  const [byPlace, byGoal, byMuscle] = await Promise.all([
    db
      .select({ k: workouts.place, n: sql<number>`count(*)` })
      .from(workouts)
      .groupBy(workouts.place),
    db
      .select({ k: workouts.goal, n: sql<number>`count(*)` })
      .from(workouts)
      .groupBy(workouts.goal),
    db
      .select({ k: workouts.targetMuscle, n: sql<number>`count(*)` })
      .from(workouts)
      .where(isNotNull(workouts.targetMuscle))
      .groupBy(workouts.targetMuscle),
  ]);
  const toMap = (rows: { k: string | null; n: number }[]) =>
    Object.fromEntries(rows.filter((r) => r.k).map((r) => [r.k as string, Number(r.n)]));
  return { place: toMap(byPlace), goal: toMap(byGoal), muscle: toMap(byMuscle) };
}

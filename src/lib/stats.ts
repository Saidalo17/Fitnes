import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { workoutSessions } from "@/db/schema";
import { currentStreak, workoutsThisWeek } from "./streak";

/** Серия дней и число тренировок за текущую неделю. */
export async function getActivityStats(userId: string, tzOffsetMin = 0) {
  const rows = await db
    .select({ finishedAt: workoutSessions.finishedAt })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)));
  const dates = rows.map((r) => r.finishedAt as Date);
  const now = new Date();
  return {
    streak: currentStreak(dates, now, tzOffsetMin),
    weekDone: workoutsThisWeek(dates, now, tzOffsetMin),
    total: dates.length,
  };
}

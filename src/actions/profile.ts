"use server";

import { eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import {
  blocks,
  friendships,
  messages,
  profiles,
  reports,
  sessionSets,
  userAchievements,
  users,
  weightLogs,
  workoutSessions,
} from "@/db/schema";
import { getT } from "@/i18n/server";
import { grantAchievements, type Unlocked } from "@/lib/achievements-data";
import { signOut } from "@/lib/auth";
import { FX_COOKIE, getTzOffset } from "@/lib/prefs";
import { requireUserId } from "@/lib/session";
import { makeProfileSchema, makeWeightSchema, type ProfileInput } from "@/lib/validators";

export type ProfileResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  unlocked?: Unlocked[];
};

/** Онбординг и редактирование: сохраняет профиль; при смене веса пишет запись в журнал. */
export async function saveProfile(input: ProfileInput): Promise<ProfileResult> {
  const userId = await requireUserId();
  const { t } = await getT();
  const parsed = makeProfileSchema(t).safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;
  const focusMuscle = v.goal === "build_muscle" ? v.focusMuscle : null;

  try {
    const [prev] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const values = {
      sex: v.sex,
      birthYear: v.birthYear,
      heightCm: v.heightCm,
      weightKg: v.weightKg,
      goal: v.goal,
      focusMuscle,
      place: v.place,
      level: v.level,
      weeklyTarget: v.weeklyTarget,
    };
    if (prev) await db.update(profiles).set(values).where(eq(profiles.userId, userId));
    else await db.insert(profiles).values({ userId, ...values });

    if (prev?.weightKg !== v.weightKg) {
      await db.insert(weightLogs).values({ userId, weightKg: v.weightKg });
    }
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Быстрая запись нового веса. */
export async function logWeight(weightKg: number): Promise<ProfileResult> {
  const userId = await requireUserId();
  const { t } = await getT();
  const parsed = makeWeightSchema(t).safeParse(weightKg);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    await db.update(profiles).set({ weightKg: parsed.data }).where(eq(profiles.userId, userId));
    await db.insert(weightLogs).values({ userId, weightKg: parsed.data });
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  const unlocked = await grantAchievements(userId, await getTzOffset());
  revalidatePath("/", "layout");
  return { ok: true, unlocked };
}

/** Удаляет аккаунт и все данные пользователя, затем выходит. */
export async function deleteAccount() {
  const userId = await requireUserId();
  const sessions = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId));
  const ids = sessions.map((s) => s.id);
  if (ids.length) await db.delete(sessionSets).where(inArray(sessionSets.sessionId, ids));
  await db.delete(workoutSessions).where(eq(workoutSessions.userId, userId));
  await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
  await db.delete(weightLogs).where(eq(weightLogs.userId, userId));
  await db
    .delete(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)));
  await db
    .delete(friendships)
    .where(or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)));
  await db.delete(blocks).where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId)));
  await db
    .delete(reports)
    .where(or(eq(reports.reporterId, userId), eq(reports.reportedId, userId)));
  await db.delete(profiles).where(eq(profiles.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/login" });
}

/** Включает/выключает анимации и конфетти (БД + cookie для быстрого чтения в layout). */
export async function setReduceEffects(reduce: boolean) {
  const userId = await requireUserId();
  await db.update(profiles).set({ reduceEffects: !!reduce }).where(eq(profiles.userId, userId));
  (await cookies()).set(FX_COOKIE, reduce ? "off" : "on", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { foods, mealLogs, profiles, waterLogs } from "@/db/schema";
import { localDay, MEALS } from "@/lib/nutrition";
import { getNutritionPage } from "@/lib/nutrition-data";
import { getTzOffset } from "@/lib/prefs";
import { requireUserId } from "@/lib/session";

const MAX_WATER_ML = 8000;
const mealEnum = z.enum(MEALS as unknown as [string, ...string[]]);

async function today() {
  return localDay(new Date(), await getTzOffset());
}

const addSchema = z.object({
  meal: mealEnum,
  foodId: z.number().int().positive(),
  grams: z.number().min(1).max(2000),
});

/** Добавляет продукт в приём пищи за сегодня. */
export async function addFood(input: z.infer<typeof addSchema>): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { meal, foodId, grams } = parsed.data;
  const [food] = await db.select({ id: foods.id }).from(foods).where(eq(foods.id, foodId));
  if (!food) return { ok: false };
  await db.insert(mealLogs).values({
    userId,
    day: await today(),
    meal: meal as (typeof MEALS)[number],
    foodId,
    grams: Math.round(grams * 10) / 10,
  });
  revalidatePath("/nutrition");
  return { ok: true };
}

/** Удаляет только свою запись. */
export async function removeFood(id: number): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  if (!Number.isInteger(id) || id <= 0) return { ok: false };
  await db.delete(mealLogs).where(and(eq(mealLogs.id, id), eq(mealLogs.userId, userId)));
  revalidatePath("/nutrition");
  return { ok: true };
}

/** Добавляет в приём пищи рекомендованное меню (по цели пользователя). */
export async function applySuggested(meal: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const m = mealEnum.safeParse(meal);
  if (!m.success) return { ok: false };
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!profile) return { ok: false };
  const data = await getNutritionPage(userId, profile, await getTzOffset());
  const items = data.suggestions[m.data as (typeof MEALS)[number]];
  if (!items.length) return { ok: false };
  await db.insert(mealLogs).values(
    items.map((i) => ({
      userId,
      day: data.day,
      meal: m.data as (typeof MEALS)[number],
      foodId: i.foodId,
      grams: i.grams,
    })),
  );
  revalidatePath("/nutrition");
  return { ok: true };
}

/** Изменяет выпитую за сегодня воду (дельта в мл, итог 0…8000). */
export async function changeWater(deltaMl: number): Promise<{ ok: boolean; ml?: number }> {
  const userId = await requireUserId();
  if (!Number.isInteger(deltaMl) || Math.abs(deltaMl) > 2000) return { ok: false };
  const day = await today();
  const [row] = await db
    .select({ ml: waterLogs.ml })
    .from(waterLogs)
    .where(and(eq(waterLogs.userId, userId), eq(waterLogs.day, day)));
  const next = Math.min(MAX_WATER_ML, Math.max(0, (row?.ml ?? 0) + deltaMl));
  await db
    .insert(waterLogs)
    .values({ userId, day, ml: next })
    .onConflictDoUpdate({ target: [waterLogs.userId, waterLogs.day], set: { ml: next } });
  revalidatePath("/nutrition");
  return { ok: true, ml: next };
}

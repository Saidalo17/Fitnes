import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db/client";
import { foods, mealLogs, waterLogs } from "@/db/schema";
import type { Goal } from "./bmi";
import {
  MEALS,
  MENU_TEMPLATES,
  buildSuggestion,
  calcTargets,
  localDay,
  type MealKey,
  type Sex,
  type Targets,
} from "./nutrition";

export type FoodDTO = typeof foods.$inferSelect;
export type LogDTO = { id: number; meal: MealKey; foodId: number; grams: number };

export type NutritionPageData = {
  day: string;
  goal: Goal;
  targets: Targets;
  foods: FoodDTO[];
  logs: LogDTO[];
  waterMl: number;
  suggestions: Record<MealKey, { foodId: number; grams: number }[]>;
};

type ProfileLike = {
  sex: Sex | null;
  birthYear: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: Goal | null;
  weeklyTarget: number | null;
};

/** Цели питания пользователя из профиля (запасные значения — если поле не заполнено). */
export function targetsFromProfile(p: ProfileLike): { goal: Goal; targets: Targets } {
  const goal = p.goal ?? "build_muscle";
  return {
    goal,
    targets: calcTargets({
      sex: p.sex ?? "other",
      birthYear: p.birthYear ?? 1995,
      heightCm: p.heightCm ?? 175,
      weightKg: p.weightKg ?? 70,
      goal,
      weeklyTarget: p.weeklyTarget ?? 3,
    }),
  };
}

/** Справочник продуктов одинаков для всех — кешируем на час. */
const getFoodsCached = unstable_cache(
  () => db.select().from(foods).orderBy(asc(foods.category), asc(foods.name)),
  ["foods-catalog"],
  { revalidate: 3600 },
);

export async function getNutritionPage(
  userId: string,
  profile: ProfileLike,
  tzOffsetMin: number,
): Promise<NutritionPageData> {
  const day = localDay(new Date(), tzOffsetMin);
  const { goal, targets } = targetsFromProfile(profile);

  const [allFoods, logs, water] = await Promise.all([
    getFoodsCached(),
    db
      .select({
        id: mealLogs.id,
        meal: mealLogs.meal,
        foodId: mealLogs.foodId,
        grams: mealLogs.grams,
      })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), eq(mealLogs.day, day)))
      .orderBy(asc(mealLogs.id)),
    db
      .select({ ml: waterLogs.ml })
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, userId), eq(waterLogs.day, day))),
  ]);

  const bySlug = new Map(allFoods.map((f) => [f.slug, { slug: f.slug, kcal: f.kcal, id: f.id }]));
  const suggestions = Object.fromEntries(
    MEALS.map((m) => [
      m,
      buildSuggestion(MENU_TEMPLATES[goal][m], bySlug, targets.perMeal[m]).map((s) => ({
        foodId: bySlug.get(s.slug)!.id,
        grams: s.grams,
      })),
    ]),
  ) as NutritionPageData["suggestions"];

  return { day, goal, targets, foods: allFoods, logs, waterMl: water[0]?.ml ?? 0, suggestions };
}

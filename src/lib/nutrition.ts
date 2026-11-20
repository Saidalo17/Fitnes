import type { Goal } from "./bmi";

export type Sex = "male" | "female" | "other";
export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";
export const MEALS: readonly MealKey[] = ["breakfast", "lunch", "dinner", "snack"];

/** Доля суточных калорий по приёмам пищи. */
export const MEAL_SHARE: Record<MealKey, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.15,
};

export type Macros = { protein: number; fat: number; carbs: number };

export type Targets = {
  bmr: number;
  tdee: number;
  kcal: number;
  macros: Macros;
  waterMl: number;
  perMeal: Record<MealKey, number>;
  /** Дефицит не применялся (несовершеннолетний) — показываем предупреждение. */
  minorNoDeficit: boolean;
};

/** Базовый обмен по Миффлину — Сан-Жеору (ккал/сутки). */
export function bmr(opts: { sex: Sex; weightKg: number; heightCm: number; age: number }) {
  const { sex, weightKg, heightCm, age } = opts;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const adj = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  return Math.round(base + adj);
}

/** Коэффициент активности по числу тренировок в неделю. */
export function activityFactor(weeklyTarget: number) {
  if (weeklyTarget <= 2) return 1.375;
  if (weeklyTarget <= 4) return 1.55;
  if (weeklyTarget <= 6) return 1.725;
  return 1.9;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

/** Целевая калорийность и БЖУ по цели; безопасные минимумы, без дефицита до 18 лет. */
export function calcTargets(p: {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  weeklyTarget: number;
  year?: number;
}): Targets {
  const age = (p.year ?? new Date().getFullYear()) - p.birthYear;
  const base = bmr({ sex: p.sex, weightKg: p.weightKg, heightCm: p.heightCm, age });
  const tdee = Math.round(base * activityFactor(p.weeklyTarget));
  const minor = age < 18;

  let kcal: number;
  let proteinPerKg: number;
  if (p.goal === "lose_weight") {
    const floor = p.sex === "male" ? 1500 : 1200;
    kcal = minor ? tdee : Math.max(floor, Math.round(tdee * 0.8));
    proteinPerKg = 2.0;
  } else if (p.goal === "gain_weight") {
    kcal = Math.round(tdee * 1.15);
    proteinPerKg = 1.8;
  } else {
    kcal = Math.round(tdee * 1.08);
    proteinPerKg = 2.0;
  }
  kcal = round5(kcal);

  const protein = Math.round(p.weightKg * proteinPerKg);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  const waterMl = Math.min(4000, Math.max(1500, Math.round((p.weightKg * 35) / 50) * 50));

  const perMeal = Object.fromEntries(MEALS.map((m) => [m, round5(kcal * MEAL_SHARE[m])])) as Record<
    MealKey,
    number
  >;

  return {
    bmr: base,
    tdee,
    kcal,
    macros: { protein, fat, carbs },
    waterMl,
    perMeal,
    minorNoDeficit: minor && p.goal === "lose_weight",
  };
}

export type FoodNutrition = { kcal: number; protein: number; fat: number; carbs: number };

/** КБЖУ порции: значения в БД — на 100 г. */
export function portion(food: FoodNutrition, grams: number): FoodNutrition {
  const k = grams / 100;
  const r1 = (n: number) => Math.round(n * k * 10) / 10;
  return {
    kcal: Math.round(food.kcal * k),
    protein: r1(food.protein),
    fat: r1(food.fat),
    carbs: r1(food.carbs),
  };
}

export function sumNutrition(items: FoodNutrition[]): FoodNutrition {
  const t = items.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      protein: a.protein + i.protein,
      fat: a.fat + i.fat,
      carbs: a.carbs + i.carbs,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), fat: r1(t.fat), carbs: r1(t.carbs) };
}

/** Продукт меню: либо доля калорий приёма пищи (share), либо фиксированная порция (grams — для овощей). */
export type MenuTemplateItem = { slug: string; share?: number; grams?: number };
export type FoodLite = { slug: string; kcal: number };

/**
 * Рекомендуемое меню на приём пищи: делит целевые калории между продуктами по долям
 * и переводит в граммы (шаг 5 г, минимум 10 г).
 */
export function buildSuggestion(
  template: MenuTemplateItem[],
  foods: Map<string, FoodLite>,
  mealKcal: number,
): { slug: string; grams: number }[] {
  const items = template.filter((t) => foods.has(t.slug));
  const fixed = items.filter((i) => i.grams != null);
  const shared = items.filter((i) => i.grams == null);
  const fixedKcal = fixed.reduce((s, i) => s + (foods.get(i.slug)!.kcal * (i.grams ?? 0)) / 100, 0);
  const rest = Math.max(0, mealKcal - fixedKcal);
  const total = shared.reduce((s, i) => s + (i.share ?? 0), 0);

  return items.map((i) => {
    if (i.grams != null) return { slug: i.slug, grams: i.grams };
    const food = foods.get(i.slug)!;
    const kcal = total ? (rest * (i.share ?? 0)) / total : 0;
    return { slug: i.slug, grams: Math.max(10, round5((kcal / food.kcal) * 100)) };
  });
}

/** Меню по целям и приёмам пищи (доли калорий между продуктами). */
export const MENU_TEMPLATES: Record<Goal, Record<MealKey, MenuTemplateItem[]>> = {
  lose_weight: {
    breakfast: [
      { slug: "oatmeal", share: 0.4 },
      { slug: "greek-yogurt", share: 0.3 },
      { slug: "blueberries", share: 0.15 },
      { slug: "almonds", share: 0.15 },
    ],
    lunch: [
      { slug: "chicken-breast", share: 0.35 },
      { slug: "buckwheat", share: 0.3 },
      { slug: "broccoli", grams: 150 },
      { slug: "olive-oil", share: 0.15 },
      { slug: "tomato", grams: 120 },
    ],
    dinner: [
      { slug: "cod", share: 0.4 },
      { slug: "sweet-potato", share: 0.3 },
      { slug: "spinach", grams: 80 },
      { slug: "olive-oil", share: 0.1 },
      { slug: "cucumber", grams: 120 },
    ],
    snack: [
      { slug: "apple", share: 0.5 },
      { slug: "cottage-cheese", share: 0.5 },
    ],
  },
  gain_weight: {
    breakfast: [
      { slug: "oatmeal", share: 0.35 },
      { slug: "milk", share: 0.15 },
      { slug: "banana", share: 0.15 },
      { slug: "peanut-butter", share: 0.2 },
      { slug: "egg", share: 0.15 },
    ],
    lunch: [
      { slug: "rice", share: 0.35 },
      { slug: "beef", share: 0.3 },
      { slug: "avocado", share: 0.1 },
      { slug: "olive-oil", share: 0.1 },
      { slug: "carrot", grams: 80 },
      { slug: "tomato", grams: 120 },
    ],
    dinner: [
      { slug: "pasta", share: 0.35 },
      { slug: "salmon", share: 0.3 },
      { slug: "broccoli", grams: 150 },
      { slug: "hard-cheese", share: 0.1 },
      { slug: "olive-oil", share: 0.1 },
      { slug: "whole-grain-bread", share: 0.1 },
    ],
    snack: [
      { slug: "walnuts", share: 0.3 },
      { slug: "banana", share: 0.2 },
      { slug: "kefir", share: 0.2 },
      { slug: "honey", share: 0.1 },
      { slug: "whole-grain-bread", share: 0.2 },
    ],
  },
  build_muscle: {
    breakfast: [
      { slug: "egg", share: 0.3 },
      { slug: "oatmeal", share: 0.3 },
      { slug: "cottage-cheese", share: 0.2 },
      { slug: "banana", share: 0.2 },
    ],
    lunch: [
      { slug: "chicken-breast", share: 0.35 },
      { slug: "rice", share: 0.35 },
      { slug: "broccoli", grams: 150 },
      { slug: "olive-oil", share: 0.1 },
      { slug: "bell-pepper", grams: 120 },
    ],
    dinner: [
      { slug: "turkey", share: 0.35 },
      { slug: "sweet-potato", share: 0.3 },
      { slug: "spinach", grams: 80 },
      { slug: "olive-oil", share: 0.1 },
      { slug: "tomato", grams: 120 },
    ],
    snack: [
      { slug: "whey-protein", share: 0.3 },
      { slug: "banana", share: 0.25 },
      { slug: "almonds", share: 0.25 },
      { slug: "greek-yogurt", share: 0.2 },
    ],
  },
};

/** Локальная дата пользователя YYYY-MM-DD (смещение часового пояса в минутах). */
export function localDay(now: Date, tzOffsetMin: number): string {
  return new Date(now.getTime() + tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

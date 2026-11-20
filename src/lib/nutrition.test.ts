import { describe, expect, it } from "vitest";
import {
  MEALS,
  MENU_TEMPLATES,
  activityFactor,
  bmr,
  buildSuggestion,
  calcTargets,
  localDay,
  portion,
  sumNutrition,
} from "./nutrition";

const man = {
  sex: "male" as const,
  birthYear: 1996,
  heightCm: 180,
  weightKg: 80,
  weeklyTarget: 3,
  year: 2026,
};

describe("bmr / activity", () => {
  it("формула Миффлина — Сан-Жеора", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5
    expect(bmr({ sex: "male", weightKg: 80, heightCm: 180, age: 30 })).toBe(1780);
    expect(bmr({ sex: "female", weightKg: 60, heightCm: 165, age: 28 })).toBe(
      Math.round(600 + 1031.25 - 140 - 161),
    );
  });
  it("коэффициент активности", () => {
    expect(activityFactor(1)).toBe(1.375);
    expect(activityFactor(3)).toBe(1.55);
    expect(activityFactor(5)).toBe(1.725);
    expect(activityFactor(7)).toBe(1.9);
  });
});

describe("calcTargets", () => {
  it("сброс веса: дефицит ~20% от суточной нормы", () => {
    const t = calcTargets({ ...man, goal: "lose_weight" });
    expect(t.kcal).toBeLessThan(t.tdee);
    expect(t.kcal).toBeGreaterThanOrEqual(1500);
    expect(Math.abs(t.kcal - t.tdee * 0.8)).toBeLessThan(10);
  });
  it("набор: профицит, масса мышц: небольшой профицит", () => {
    const gain = calcTargets({ ...man, goal: "gain_weight" });
    const muscle = calcTargets({ ...man, goal: "build_muscle" });
    expect(gain.kcal).toBeGreaterThan(gain.tdee);
    expect(muscle.kcal).toBeGreaterThan(muscle.tdee);
    expect(gain.kcal).toBeGreaterThan(muscle.kcal);
  });
  it("не опускается ниже безопасного минимума", () => {
    const t = calcTargets({
      sex: "female",
      birthYear: 1990,
      heightCm: 150,
      weightKg: 45,
      goal: "lose_weight",
      weeklyTarget: 1,
      year: 2026,
    });
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
  });
  it("до 18 лет дефицит не применяется", () => {
    const t = calcTargets({ ...man, birthYear: 2010, goal: "lose_weight" });
    expect(t.minorNoDeficit).toBe(true);
    expect(Math.abs(t.kcal - t.tdee)).toBeLessThan(5);
  });
  it("БЖУ укладываются в калории, приёмы пищи — в сумму", () => {
    const t = calcTargets({ ...man, goal: "build_muscle" });
    const fromMacros = t.macros.protein * 4 + t.macros.carbs * 4 + t.macros.fat * 9;
    expect(Math.abs(fromMacros - t.kcal)).toBeLessThan(15);
    const meals = MEALS.reduce((s, m) => s + t.perMeal[m], 0);
    expect(Math.abs(meals - t.kcal)).toBeLessThan(15);
  });
  it("вода: 35 мл/кг в пределах 1.5–4 л", () => {
    expect(calcTargets({ ...man, goal: "lose_weight" }).waterMl).toBe(2800);
    expect(calcTargets({ ...man, weightKg: 40, goal: "lose_weight" }).waterMl).toBe(1500);
    expect(calcTargets({ ...man, weightKg: 200, goal: "gain_weight" }).waterMl).toBe(4000);
  });
});

describe("порции и меню", () => {
  const oat = { kcal: 370, protein: 13, fat: 7, carbs: 62 };
  it("portion считает на граммы", () => {
    expect(portion(oat, 50)).toEqual({ kcal: 185, protein: 6.5, fat: 3.5, carbs: 31 });
  });
  it("sumNutrition суммирует", () => {
    expect(sumNutrition([portion(oat, 50), portion(oat, 50)]).kcal).toBe(370);
    expect(sumNutrition([]).kcal).toBe(0);
  });
  it("buildSuggestion даёт калорийность близкую к цели", () => {
    const foods = new Map(
      [
        ["oatmeal", 370],
        ["greek-yogurt", 59],
        ["blueberries", 57],
        ["almonds", 579],
      ].map(([slug, kcal]) => [slug as string, { slug: slug as string, kcal: kcal as number }]),
    );
    const items = buildSuggestion(MENU_TEMPLATES.lose_weight.breakfast, foods, 400);
    const kcal = items.reduce((s, i) => s + (foods.get(i.slug)!.kcal * i.grams) / 100, 0);
    expect(Math.abs(kcal - 400)).toBeLessThan(45);
    expect(items.every((i) => i.grams >= 10 && i.grams % 5 === 0)).toBe(true);
  });
  it("овощи — фиксированная порция, остальное добирает калории", () => {
    const foods = new Map([
      ["chicken-breast", { slug: "chicken-breast", kcal: 165 }],
      ["buckwheat", { slug: "buckwheat", kcal: 110 }],
      ["broccoli", { slug: "broccoli", kcal: 34 }],
      ["olive-oil", { slug: "olive-oil", kcal: 884 }],
      ["tomato", { slug: "tomato", kcal: 18 }],
    ]);
    const items = buildSuggestion(MENU_TEMPLATES.lose_weight.lunch, foods, 800);
    expect(items.find((i) => i.slug === "tomato")!.grams).toBe(120);
    expect(items.find((i) => i.slug === "broccoli")!.grams).toBe(150);
    const kcal = items.reduce((s, i) => s + (foods.get(i.slug)!.kcal * i.grams) / 100, 0);
    expect(Math.abs(kcal - 800)).toBeLessThan(60);
  });
  it("пропускает неизвестные продукты", () => {
    expect(buildSuggestion([{ slug: "nope", share: 1 }], new Map(), 400)).toEqual([]);
  });
});

describe("localDay", () => {
  it("учитывает часовой пояс", () => {
    const d = new Date("2026-11-20T22:30:00Z");
    expect(localDay(d, 0)).toBe("2026-11-20");
    expect(localDay(d, 180)).toBe("2026-11-21");
    expect(localDay(d, -300)).toBe("2026-11-20");
  });
});

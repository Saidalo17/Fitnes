"use client";

import { Droplets, Minus, Plus, Trash2, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addFood, applySuggested, changeWater, removeFood } from "@/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { localized } from "@/i18n/content";
import { cn } from "@/lib/cn";
import { MEALS, portion, sumNutrition, type MealKey } from "@/lib/nutrition";
import type { NutritionPageData } from "@/lib/nutrition-data";
import { FoodPicker } from "./food-picker";

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="h-2 overflow-hidden rounded-sm bg-surface-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
    >
      <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function NutritionView({
  data,
  minorNote,
}: {
  data: NutritionPageData;
  minorNote: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pickerMeal, setPickerMeal] = useState<MealKey | null>(null);

  const foodById = useMemo(() => new Map(data.foods.map((f) => [f.id, f])), [data.foods]);
  const name = (id: number) => {
    const f = foodById.get(id);
    return f ? localized(locale, f.name, f.nameEn) : "";
  };
  const nutritionOf = (foodId: number, grams: number) => portion(foodById.get(foodId)!, grams);

  const byMeal = (m: MealKey) => data.logs.filter((l) => l.meal === m && foodById.has(l.foodId));
  const mealTotal = (m: MealKey) =>
    sumNutrition(byMeal(m).map((l) => nutritionOf(l.foodId, l.grams)));
  const total = sumNutrition(
    data.logs.filter((l) => foodById.has(l.foodId)).map((l) => nutritionOf(l.foodId, l.grams)),
  );

  const { targets } = data;
  const diff = targets.kcal - total.kcal;
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const waterPct = Math.min(100, Math.round((data.waterMl / targets.waterMl) * 100));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("nutrition.title")}</h1>
        <p className="mt-1 text-muted">
          {t("nutrition.subtitle")} · {t(`profile.goals.${data.goal}`)}
        </p>
      </div>

      {/* Цель на день */}
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-muted">{t("nutrition.dayTarget")}</div>
            <div className="num text-4xl leading-none">
              {targets.kcal}{" "}
              <span className="text-lg font-medium text-muted">{t("nutrition.kcal")}</span>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-muted">{t("nutrition.consumed")}</div>
            <div className="num text-xl">{total.kcal}</div>
          </div>
        </div>
        <Bar value={total.kcal} max={targets.kcal} label={t("nutrition.consumed")} />
        <p className={cn("text-sm", diff < 0 ? "text-danger-text" : "text-muted")}>
          {diff >= 0
            ? t("nutrition.left", { n: diff })
            : t("nutrition.over", { n: Math.abs(diff) })}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["protein", total.protein, targets.macros.protein],
              ["fat", total.fat, targets.macros.fat],
              ["carbs", total.carbs, targets.macros.carbs],
            ] as const
          ).map(([k, v, max]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <div className="text-xs font-medium text-muted">{t(`nutrition.${k}`)}</div>
              <div className="num text-sm">
                {Math.round(v)} / {max} {t("nutrition.g")}
              </div>
              <Bar value={v} max={max} label={t(`nutrition.${k}`)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-2 p-5">
        <h2 className="text-xl font-bold">{t("nutrition.tipTitle")}</h2>
        <p className="text-sm text-muted">{t(`nutrition.tips.${data.goal}`)}</p>
        {minorNote && (
          <p className="text-sm font-semibold text-danger-text">{t("nutrition.minorNote")}</p>
        )}
      </Card>

      {/* Вода */}
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Droplets size={20} className="text-accent-text" /> {t("nutrition.water")}
          </h2>
          <span className="num text-sm text-muted">
            {data.waterMl} / {targets.waterMl} {t("nutrition.ml")}
          </span>
        </div>
        <Bar value={data.waterMl} max={targets.waterMl} label={t("nutrition.water")} />
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={pending} onClick={() => run(() => changeWater(250))}>
            <Plus size={14} /> {t("nutrition.waterAdd")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending || data.waterMl === 0}
            onClick={() => run(() => changeWater(-250))}
          >
            <Minus size={14} /> {t("nutrition.waterUndo")}
          </Button>
          <span className="text-sm text-muted">
            {waterPct >= 100
              ? t("nutrition.waterDone")
              : t("nutrition.waterTarget", { ml: targets.waterMl })}
          </span>
        </div>
      </Card>

      {/* Приёмы пищи */}
      <div className="grid gap-4 lg:grid-cols-2">
        {MEALS.map((m) => {
          const items = byMeal(m);
          const mt = mealTotal(m);
          const sug = data.suggestions[m];
          const sugKcal = sug.reduce((s, i) => s + nutritionOf(i.foodId, i.grams).kcal, 0);
          return (
            <Card key={m} className="flex flex-col gap-3 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <Utensils size={18} className="text-accent-text" /> {t(`nutrition.meals.${m}`)}
                </h2>
                <span className="num text-sm text-muted">
                  {mt.kcal} / {targets.perMeal[m]} {t("nutrition.kcal")}
                </span>
              </div>

              {items.length ? (
                <ul className="divide-y divide-line">
                  {items.map((l) => {
                    const n = nutritionOf(l.foodId, l.grams);
                    return (
                      <li key={l.id} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{name(l.foodId)}</div>
                          <div className="num text-xs text-muted">
                            {t("nutrition.gramsShort", { n: l.grams })} ·{" "}
                            {t("nutrition.macrosShort", { p: n.protein, f: n.fat, c: n.carbs })}
                          </div>
                        </div>
                        <span className="num shrink-0 text-sm">
                          {n.kcal} {t("nutrition.kcal")}
                        </span>
                        <button
                          type="button"
                          aria-label={`${t("nutrition.remove")}: ${name(l.foodId)}`}
                          disabled={pending}
                          onClick={() => run(() => removeFood(l.id))}
                          className="grid size-9 shrink-0 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">{t("nutrition.emptyMeal")}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={pending} onClick={() => setPickerMeal(m)}>
                  <Plus size={14} /> {t("nutrition.addFood")}
                </Button>
              </div>

              {items.length === 0 && sug.length > 0 && (
                <div className="rounded-sm bg-surface-2 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("nutrition.suggested")} · {t("nutrition.suggestedHint", { n: sugKcal })}
                  </div>
                  <ul className="mb-3 text-sm">
                    {sug.map((s) => (
                      <li key={s.foodId} className="flex justify-between gap-3 py-0.5">
                        <span>
                          {name(s.foodId)}{" "}
                          <span className="text-muted">
                            · {t("nutrition.gramsShort", { n: s.grams })}
                          </span>
                        </span>
                        <span className="num text-muted">
                          {nutritionOf(s.foodId, s.grams).kcal} {t("nutrition.kcal")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => applySuggested(m))}
                  >
                    {t("nutrition.applySuggested")}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted">{t("nutrition.disclaimer")}</p>

      <FoodPicker
        open={pickerMeal !== null}
        title={
          pickerMeal ? `${t(`nutrition.meals.${pickerMeal}`)} — ${t("nutrition.picker.title")}` : ""
        }
        foods={data.foods}
        pending={pending}
        onClose={() => setPickerMeal(null)}
        onAdd={(foodId, grams) => {
          const meal = pickerMeal;
          setPickerMeal(null);
          if (meal) run(() => addFood({ meal, foodId, grams }));
        }}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";
import { localized } from "@/i18n/content";
import { portion } from "@/lib/nutrition";
import type { FoodDTO } from "@/lib/nutrition-data";

const CATEGORIES = [
  "grains",
  "protein",
  "dairy",
  "vegetables",
  "fruits",
  "fats",
  "legumes",
] as const;

/** Окно выбора продукта: поиск, категории, граммы и расчёт ккал/БЖУ порции. */
export function FoodPicker({
  open,
  title,
  foods,
  pending,
  onClose,
  onAdd,
}: {
  open: boolean;
  title: string;
  foods: FoodDTO[];
  pending: boolean;
  onClose: () => void;
  onAdd: (foodId: number, grams: number) => void;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodDTO | null>(null);
  const [grams, setGrams] = useState(100);

  const name = (f: FoodDTO) => localized(locale, f.name, f.nameEn);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter(
      (f) =>
        (!category || f.category === category) &&
        (!q || f.name.toLowerCase().includes(q) || f.nameEn.toLowerCase().includes(q)),
    );
  }, [foods, query, category]);

  const nutrition = selected ? portion(selected, grams) : null;

  function close() {
    setSelected(null);
    setQuery("");
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title={selected ? name(selected) : title}>
      {selected && nutrition ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {selected.kcal} {t("nutrition.kcal")} {t("nutrition.picker.per100")}
          </p>
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            max={2000}
            label={t("nutrition.picker.grams")}
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
          />
          <div className="flex flex-wrap gap-2">
            {[0.5, 1, 1.5, 2].map((k) => (
              <Chip key={k} onClick={() => setGrams(Math.round(selected.servingG * k))}>
                {Math.round(selected.servingG * k)} {t("nutrition.g")}
              </Chip>
            ))}
          </div>
          <p className="num rounded-sm bg-surface-2 p-3 text-center text-sm">
            {t("nutrition.picker.preview", {
              kcal: nutrition.kcal,
              p: nutrition.protein,
              f: nutrition.fat,
              c: nutrition.carbs,
            })}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setSelected(null)}>
              ←
            </Button>
            <Button
              className="flex-1"
              disabled={pending || !(grams >= 1 && grams <= 2000)}
              onClick={() => {
                onAdd(selected.id, grams);
                setSelected(null);
                setQuery("");
              }}
            >
              {t("nutrition.picker.add")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Input
            type="search"
            aria-label={t("nutrition.picker.search")}
            placeholder={t("nutrition.picker.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            <Chip active={!category} onClick={() => setCategory(null)}>
              {t("nutrition.picker.all")}
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => setCategory(category === c ? null : c)}
              >
                {t(`nutrition.categories.${c}`)}
              </Chip>
            ))}
          </div>
          <ul className="-mx-1 max-h-72 overflow-y-auto">
            {list.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(f);
                    setGrams(f.servingG);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-2.5 text-left hover:bg-surface-2"
                >
                  <span className="text-sm font-medium">{name(f)}</span>
                  <span className="num shrink-0 text-xs text-muted">
                    {f.kcal} {t("nutrition.kcal")}
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="py-6 text-center text-sm text-muted">
                {t("nutrition.picker.nothing")}
              </li>
            )}
          </ul>
        </div>
      )}
    </Modal>
  );
}

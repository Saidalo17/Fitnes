export type BmiCategory = "under" | "normal" | "over" | "obese";
export type Goal = "lose_weight" | "gain_weight" | "build_muscle";

/** ИМТ = вес (кг) / рост (м)², округлено до 0.1. */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "under";
  if (value < 25) return "normal";
  if (value < 30) return "over";
  return "obese";
}

/** Мягкая подсказка по цели (справочно; решение всегда за пользователем). */
export function suggestedGoal(value: number): Goal {
  if (value < 18.5) return "gain_weight";
  if (value >= 25) return "lose_weight";
  return "build_muscle";
}

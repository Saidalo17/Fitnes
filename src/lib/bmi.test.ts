import { describe, expect, it } from "vitest";
import { bmi, bmiCategory, suggestedGoal } from "./bmi";

describe("bmi", () => {
  it("считает ИМТ", () => {
    expect(bmi(70, 175)).toBe(22.9);
    expect(bmi(100, 180)).toBe(30.9);
  });
  it("определяет категорию на границах", () => {
    expect(bmiCategory(18.4)).toBe("under");
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(24.9)).toBe("normal");
    expect(bmiCategory(25)).toBe("over");
    expect(bmiCategory(30)).toBe("obese");
  });
  it("подсказывает цель", () => {
    expect(suggestedGoal(17)).toBe("gain_weight");
    expect(suggestedGoal(22)).toBe("build_muscle");
    expect(suggestedGoal(27)).toBe("lose_weight");
  });
});

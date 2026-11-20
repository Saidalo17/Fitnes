import { describe, expect, it } from "vitest";
import { recommend, type RecWorkout } from "./recommend";

const w = (id: number, over: Partial<RecWorkout> = {}): RecWorkout => ({
  id,
  place: "home",
  goal: "lose_weight",
  targetMuscle: null,
  level: "beginner",
  xpReward: 40,
  ...over,
});

const profile = {
  goal: "lose_weight",
  focusMuscle: null,
  place: "home",
  level: "beginner",
} as const;

describe("recommend", () => {
  it("фильтрует по месту и цели", () => {
    const res = recommend([w(1), w(2, { place: "gym" }), w(3, { goal: "gain_weight" })], profile);
    expect(res.map((x) => x.id)).toEqual([1]);
  });

  it("place=both подходит любое место", () => {
    const res = recommend([w(1), w(2, { place: "gym" })], { ...profile, place: "both" });
    expect(res.map((x) => x.id).sort()).toEqual([1, 2]);
  });

  it("для build_muscle учитывает мышцу", () => {
    const p = { ...profile, goal: "build_muscle", focusMuscle: "arms" } as const;
    const res = recommend(
      [
        w(1, { goal: "build_muscle", targetMuscle: "arms" }),
        w(2, { goal: "build_muscle", targetMuscle: "legs" }),
      ],
      p,
    );
    expect(res.map((x) => x.id)).toEqual([1]);
  });

  it("сначала ближайший уровень, потом непройденные, потом XP", () => {
    const res = recommend(
      [
        w(1, { level: "intermediate", xpReward: 100 }),
        w(2, { level: "beginner", xpReward: 10 }),
        w(3, { level: "beginner", xpReward: 50 }),
      ],
      profile,
      new Set([3]),
    );
    expect(res.map((x) => x.id)).toEqual([2, 3, 1]);
  });

  it("исключает уровень на 2 ступени дальше, если есть ближе", () => {
    const res = recommend([w(1, { level: "advanced" }), w(2)], profile);
    expect(res.map((x) => x.id)).toEqual([2]);
  });

  it("если подходящего уровня нет — снимает ограничение по уровню", () => {
    const res = recommend([w(1, { level: "advanced" })], profile);
    expect(res.map((x) => x.id)).toEqual([1]);
  });

  it("уважает лимит", () => {
    const res = recommend([w(1), w(2), w(3), w(4)], profile, new Set(), 2);
    expect(res).toHaveLength(2);
  });
});

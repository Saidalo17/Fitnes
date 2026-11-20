import { describe, expect, it } from "vitest";
import { earnedAchievements, type AchievementContext } from "./achievements";

const base: AchievementContext = {
  finishedWorkouts: 0,
  streak: 0,
  startWeightKg: null,
  currentWeightKg: null,
  musclesTrained: new Set(),
};

describe("earnedAchievements", () => {
  it("ничего без активности", () => {
    expect(earnedAchievements(base)).toEqual([]);
  });
  it("первая тренировка", () => {
    expect(earnedAchievements({ ...base, finishedWorkouts: 1 })).toEqual(["first_workout"]);
  });
  it("серии 3 и 7 дней", () => {
    expect(earnedAchievements({ ...base, streak: 3 })).toEqual(["streak_3"]);
    expect(earnedAchievements({ ...base, streak: 7 })).toEqual(["streak_3", "streak_7"]);
  });
  it("10 и 50 тренировок", () => {
    const r = earnedAchievements({ ...base, finishedWorkouts: 10 });
    expect(r).toContain("workouts_10");
    expect(r).not.toContain("workouts_50");
    expect(earnedAchievements({ ...base, finishedWorkouts: 50 })).toContain("workouts_50");
  });
  it("минус 1 кг от стартового веса", () => {
    expect(earnedAchievements({ ...base, startWeightKg: 80, currentWeightKg: 79 })).toEqual([
      "lost_1kg",
    ]);
    expect(earnedAchievements({ ...base, startWeightKg: 80, currentWeightKg: 79.5 })).toEqual([]);
    expect(earnedAchievements({ ...base, startWeightKg: 70, currentWeightKg: 72 })).toEqual([]);
    expect(earnedAchievements({ ...base, startWeightKg: 80.4, currentWeightKg: 79.4 })).toEqual([
      "lost_1kg",
    ]);
  });
  it("все группы мышц (без «всё тело»)", () => {
    const six = new Set(["chest", "back", "legs", "shoulders", "arms", "abs"]);
    expect(earnedAchievements({ ...base, musclesTrained: six })).toEqual([]);
    const all = new Set([...six, "glutes"]);
    expect(earnedAchievements({ ...base, musclesTrained: all })).toEqual(["all_muscles"]);
  });
});

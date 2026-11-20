import { describe, expect, it } from "vitest";
import { calcVolume, calcXp, levelInfo } from "./xp";

describe("calcVolume", () => {
  it("суммирует повторы × вес только по выполненным подходам", () => {
    expect(
      calcVolume([
        { reps: 10, weightKg: 20, completed: true },
        { reps: 8, weightKg: 22.5, completed: true },
        { reps: 10, weightKg: 100, completed: false },
      ]),
    ).toBe(380);
  });
  it("подходы без веса не дают объёма", () => {
    expect(calcVolume([{ reps: 15, weightKg: null, completed: true }])).toBe(0);
  });
  it("пустой список — 0", () => {
    expect(calcVolume([])).toBe(0);
  });
});

describe("calcXp", () => {
  it("полная тренировка: награда + 10% бонус", () => {
    expect(calcXp({ xpReward: 60, completedSets: 12, totalSets: 12 })).toBe(66);
  });
  it("частично: пропорционально, без бонуса", () => {
    expect(calcXp({ xpReward: 60, completedSets: 6, totalSets: 12 })).toBe(30);
  });
  it("ничего не сделано — 0", () => {
    expect(calcXp({ xpReward: 60, completedSets: 0, totalSets: 12 })).toBe(0);
    expect(calcXp({ xpReward: 60, completedSets: 3, totalSets: 0 })).toBe(0);
  });
  it("не превышает награду + бонус при лишних подходах", () => {
    expect(calcXp({ xpReward: 50, completedSets: 20, totalSets: 10 })).toBe(55);
  });
});

describe("levelInfo", () => {
  it("уровни по формуле", () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(399).level).toBe(2);
    expect(levelInfo(400).level).toBe(3);
  });
  it("прогресс до следующего уровня", () => {
    const i = levelInfo(250); // уровень 2: 100..400
    expect(i.level).toBe(2);
    expect(i.progress).toBeCloseTo(0.5);
  });
});

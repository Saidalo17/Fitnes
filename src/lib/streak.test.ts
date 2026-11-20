import { describe, expect, it } from "vitest";
import { currentStreak, workoutsThisWeek } from "./streak";

const d = (s: string) => new Date(s);

describe("currentStreak", () => {
  const now = d("2026-11-20T12:00:00Z"); // пятница

  it("0 без тренировок", () => {
    expect(currentStreak([], now)).toBe(0);
  });
  it("считает дни подряд, включая сегодня", () => {
    expect(
      currentStreak(
        [d("2026-11-20T08:00:00Z"), d("2026-11-19T20:00:00Z"), d("2026-11-18T07:00:00Z")],
        now,
      ),
    ).toBe(3);
  });
  it("не обрывается, если сегодня ещё не тренировались", () => {
    expect(currentStreak([d("2026-11-19T10:00:00Z"), d("2026-11-18T10:00:00Z")], now)).toBe(2);
  });
  it("обрывается при пропуске дня", () => {
    expect(currentStreak([d("2026-11-18T10:00:00Z"), d("2026-11-17T10:00:00Z")], now)).toBe(0);
  });
  it("несколько тренировок в один день — один день", () => {
    expect(currentStreak([d("2026-11-20T06:00:00Z"), d("2026-11-20T18:00:00Z")], now)).toBe(1);
  });
  it("учитывает часовой пояс", () => {
    // 23:30 UTC 19-го — это уже 20-е в UTC+3
    const late = d("2026-11-19T23:30:00Z");
    expect(currentStreak([late], d("2026-11-20T09:00:00Z"), 180)).toBe(1);
    expect(currentStreak([late, d("2026-11-18T10:00:00Z")], d("2026-11-20T09:00:00Z"), 0)).toBe(2);
  });
});

describe("workoutsThisWeek", () => {
  it("неделя с понедельника", () => {
    const now = d("2026-11-20T12:00:00Z"); // пт; неделя: 16–22 ноября
    const dates = [
      d("2026-11-15T20:00:00Z"), // воскресенье прошлой недели
      d("2026-11-16T08:00:00Z"), // понедельник
      d("2026-11-20T08:00:00Z"),
    ];
    expect(workoutsThisWeek(dates, now)).toBe(2);
  });
});

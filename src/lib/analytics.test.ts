import { describe, expect, it } from "vitest";
import {
  bucketStart,
  buildBuckets,
  granularityFor,
  parseRange,
  personalRecords,
  sumByBucket,
  weightSummary,
} from "./analytics";

const d = (s: string) => new Date(s);

describe("range", () => {
  it("parseRange: неизвестное значение → 30d", () => {
    expect(parseRange("90d")).toBe("90d");
    expect(parseRange("zzz")).toBe("30d");
    expect(parseRange(undefined)).toBe("30d");
  });
  it("гранулярность по периоду", () => {
    expect(granularityFor("7d")).toBe("day");
    expect(granularityFor("30d")).toBe("week");
    expect(granularityFor("1y")).toBe("month");
  });
});

describe("buckets", () => {
  it("начало недели — понедельник (UTC)", () => {
    expect(bucketStart(d("2026-11-20T15:00:00Z"), "week").toISOString()).toBe(
      "2026-11-16T00:00:00.000Z",
    );
    expect(bucketStart(d("2026-11-22T23:59:00Z"), "week").toISOString()).toBe(
      "2026-11-16T00:00:00.000Z",
    );
    expect(bucketStart(d("2026-11-23T00:00:00Z"), "week").toISOString()).toBe(
      "2026-11-23T00:00:00.000Z",
    );
  });
  it("начало месяца", () => {
    expect(bucketStart(d("2026-11-20T15:00:00Z"), "month").toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });
  it("buildBuckets включает пустые корзины", () => {
    const b = buildBuckets(d("2026-11-14T00:00:00Z"), d("2026-11-20T00:00:00Z"), "day");
    expect(b).toHaveLength(7);
    const w = buildBuckets(d("2026-10-01T00:00:00Z"), d("2026-11-20T00:00:00Z"), "week");
    expect(w[0].toISOString()).toBe("2026-09-28T00:00:00.000Z");
    expect(w.at(-1)!.toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
  it("sumByBucket суммирует и держит нули", () => {
    const buckets = buildBuckets(d("2026-11-16T00:00:00Z"), d("2026-11-22T00:00:00Z"), "day");
    const sums = sumByBucket(
      [
        { date: d("2026-11-16T08:00:00Z"), value: 100 },
        { date: d("2026-11-16T19:00:00Z"), value: 50.5 },
        { date: d("2026-11-18T08:00:00Z"), value: 30 },
        { date: d("2026-12-01T08:00:00Z"), value: 999 }, // вне периода
      ],
      buckets,
      "day",
    );
    expect(sums).toEqual([150.5, 0, 30, 0, 0, 0, 0]);
  });
});

describe("weightSummary", () => {
  it("пусто → null", () => expect(weightSummary([])).toBeNull());
  it("считает изменение", () => {
    expect(weightSummary([{ kg: 80 }, { kg: 79 }, { kg: 78.4 }])).toEqual({
      start: 80,
      current: 78.4,
      delta: -1.6,
    });
  });
});

describe("personalRecords", () => {
  it("лучший вес по упражнению, сортировка по убыванию", () => {
    const rows = [
      { key: 1, weightKg: 20, at: d("2026-11-01T00:00:00Z") },
      { key: 1, weightKg: 25, at: d("2026-11-05T00:00:00Z") },
      { key: 2, weightKg: 60, at: d("2026-11-02T00:00:00Z") },
      { key: 3, weightKg: 10, at: d("2026-11-03T00:00:00Z") },
    ];
    expect(personalRecords(rows, 2).map((r) => [r.key, r.weightKg])).toEqual([
      [2, 60],
      [1, 25],
    ]);
  });
  it("при равном весе берёт более позднюю дату", () => {
    const rows = [
      { key: 1, weightKg: 20, at: d("2026-11-01T00:00:00Z") },
      { key: 1, weightKg: 20, at: d("2026-11-09T00:00:00Z") },
    ];
    expect(personalRecords(rows)[0].at.toISOString()).toBe("2026-11-09T00:00:00.000Z");
  });
});

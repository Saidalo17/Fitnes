export const RANGES = ["7d", "30d", "90d", "1y"] as const;
export type Range = (typeof RANGES)[number];
export type Granularity = "day" | "week" | "month";

const DAY_MS = 86_400_000;

export function parseRange(v: unknown): Range {
  return (RANGES as readonly string[]).includes(v as string) ? (v as Range) : "30d";
}

export const rangeDays = (r: Range) => ({ "7d": 7, "30d": 30, "90d": 90, "1y": 365 })[r];

/** 7 дней — по дням, 30/90 — по неделям, год — по месяцам. */
export const granularityFor = (r: Range): Granularity =>
  r === "7d" ? "day" : r === "1y" ? "month" : "week";

function utcDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Начало корзины (UTC): день / понедельник недели / 1-е число месяца. */
export function bucketStart(d: Date, g: Granularity): Date {
  const day = utcDay(d);
  if (g === "day") return new Date(day);
  if (g === "week") {
    const weekday = (new Date(day).getUTCDay() + 6) % 7; // пн = 0
    return new Date(day - weekday * DAY_MS);
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function nextBucket(d: Date, g: Granularity): Date {
  if (g === "day") return new Date(d.getTime() + DAY_MS);
  if (g === "week") return new Date(d.getTime() + 7 * DAY_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

/** Все корзины от `from` до `to` включительно (пустые тоже). */
export function buildBuckets(from: Date, to: Date, g: Granularity): Date[] {
  const out: Date[] = [];
  let cur = bucketStart(from, g);
  const end = bucketStart(to, g).getTime();
  while (cur.getTime() <= end) {
    out.push(cur);
    cur = nextBucket(cur, g);
  }
  return out;
}

/** Суммирует значения по корзинам; результат выровнен с `buckets`. */
export function sumByBucket(
  items: { date: Date; value: number }[],
  buckets: Date[],
  g: Granularity,
): number[] {
  const index = new Map(buckets.map((b, i) => [b.getTime(), i]));
  const out = buckets.map(() => 0);
  for (const it of items) {
    const i = index.get(bucketStart(it.date, g).getTime());
    if (i !== undefined) out[i] += it.value;
  }
  return out.map((v) => Math.round(v * 10) / 10);
}

export function weightSummary(points: { kg: number }[]) {
  if (!points.length) return null;
  const start = points[0].kg;
  const current = points[points.length - 1].kg;
  return { start, current, delta: Math.round((current - start) * 10) / 10 };
}

/** Первая запись по каждому ключу с наибольшим весом (при равенстве — более поздняя). */
export function personalRecords<T extends { key: number; weightKg: number; at: Date }>(
  rows: T[],
  limit = 5,
): T[] {
  const best = new Map<number, T>();
  for (const r of rows) {
    const cur = best.get(r.key);
    if (!cur || r.weightKg > cur.weightKg || (r.weightKg === cur.weightKg && r.at > cur.at))
      best.set(r.key, r);
  }
  return [...best.values()].sort((a, b) => b.weightKg - a.weightKg).slice(0, limit);
}

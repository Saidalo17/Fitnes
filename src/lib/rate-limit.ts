// Простое ограничение числа попыток в памяти процесса.
// На проде с несколькими инстансами заменить на Upstash/Redis (см. SPEC.md §6).
const WINDOW_MS = 60_000;
const MAX_FAILS = 5;

const fails = new Map<string, number[]>();

function recent(key: string) {
  const now = Date.now();
  const list = (fails.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length) fails.set(key, list);
  else fails.delete(key);
  return list;
}

export function isLimited(key: string) {
  return recent(key).length >= MAX_FAILS;
}

export function registerFail(key: string) {
  const list = recent(key);
  list.push(Date.now());
  fails.set(key, list);
}

export function resetFails(key: string) {
  fails.delete(key);
}

/** Скользящее окно: не более `max` событий за `windowMs` на ключ (в памяти процесса). */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  const recentHits = (key: string) => {
    const now = Date.now();
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (list.length) hits.set(key, list);
    else hits.delete(key);
    return list;
  };
  return {
    /** Регистрирует событие; false — лимит превышен. */
    take(key: string) {
      const list = recentHits(key);
      if (list.length >= max) return false;
      list.push(Date.now());
      hits.set(key, list);
      return true;
    },
  };
}

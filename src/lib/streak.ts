const DAY_MS = 86_400_000;

/** Номер локального дня (целое число) для даты с учётом смещения часового пояса в минутах. */
function dayNumber(d: Date, tzOffsetMin: number) {
  return Math.floor((d.getTime() + tzOffsetMin * 60_000) / DAY_MS);
}

/**
 * Серия: сколько календарных дней подряд есть хотя бы одна тренировка.
 * Серия не обрывается, если сегодня ещё не тренировались, но вчера — да.
 */
export function currentStreak(dates: Date[], now: Date, tzOffsetMin = 0): number {
  const days = new Set(dates.map((d) => dayNumber(d, tzOffsetMin)));
  const today = dayNumber(now, tzOffsetMin);
  let cursor = days.has(today) ? today : today - 1;
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor--;
  }
  return count;
}

/** Сколько тренировок в текущей неделе (неделя начинается в понедельник). */
export function workoutsThisWeek(dates: Date[], now: Date, tzOffsetMin = 0): number {
  const today = dayNumber(now, tzOffsetMin);
  // 1970-01-01 — четверг: (day + 3) % 7 = 0 для понедельника
  const weekday = (today + 3) % 7;
  const weekStart = today - weekday;
  return dates.filter((d) => {
    const n = dayNumber(d, tzOffsetMin);
    return n >= weekStart && n <= weekStart + 6;
  }).length;
}

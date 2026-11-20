/** «Красивые» равномерные деления оси: шаг 1/2/5 × 10^k. */
export function niceTicks(min: number, max: number, count = 4, integer = false) {
  if (max <= min) max = min + 1;
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  if (integer) step = Math.max(1, Math.ceil(step));
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v < max + step * 0.999; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
    if (v >= max) break;
  }
  return { ticks, domain: [ticks[0], ticks[ticks.length - 1]] as [number, number] };
}

/** До 10 000 — полностью (0 / 1000 / 2000), дальше компактно (10K / 20K). */
export function formatTick(v: number) {
  return Math.abs(v) >= 10000 ? `${+(v / 1000).toFixed(1)}K` : String(v);
}

/** Кольцо прогресса недельной цели: дуга цвета акцента на нейтральной дорожке. */
export function WeekRing({
  done,
  target,
  size = 36,
  label,
}: {
  done: number;
  target: number;
  size?: number;
  label: string;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = target > 0 ? Math.min(1, done / target) : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--line)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
      />
    </svg>
  );
}

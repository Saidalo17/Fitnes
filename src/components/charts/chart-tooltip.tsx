type Props = {
  active?: boolean;
  label?: string | number;
  payload?: readonly { value?: number | string | readonly (number | string)[] }[];
  unit: string;
};

/** Подсказка при наведении: карточка в стиле интерфейса (токены темы). */
export function ChartTooltip({ active, label, payload, unit }: Props) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value;
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  return (
    <div className="rounded-sm border border-line bg-surface px-3 py-2 text-sm shadow-card">
      <div className="text-xs text-muted">{label}</div>
      <div className="num">
        {value} {unit}
      </div>
    </div>
  );
}

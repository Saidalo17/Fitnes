import type { TFunction } from "@/i18n/translate";

type Item = { muscle: string; sets: number };

/** Горизонтальные столбцы: подпись слева, значение на конце столбца. Один цвет — величина. */
export function MuscleBars({ items, t }: { items: Item[]; t: TFunction }) {
  const max = Math.max(1, ...items.map((i) => i.sets));
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i.muscle} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm">
          <span className="truncate text-muted">{t(`profile.muscles.${i.muscle as "chest"}`)}</span>
          <div className="flex items-center gap-2">
            <div
              className="h-2 rounded-r-[4px] bg-accent"
              style={{
                width: `${Math.max(2, (i.sets / max) * 100)}%`,
                maxWidth: "calc(100% - 3rem)",
              }}
              role="img"
              aria-label={`${i.sets} ${t("analytics.sets")}`}
            />
            <span className="num shrink-0">{i.sets}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

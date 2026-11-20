import { Clock, Dumbbell, Flame, ListChecks } from "lucide-react";
import Link from "next/link";
import type { WorkoutListItem } from "@/lib/workouts";
import type { Locale } from "@/i18n/config";
import { localized } from "@/i18n/content";
import type { TFunction } from "@/i18n/translate";

const LEVEL_FLAMES = { beginner: 1, intermediate: 2, advanced: 3 } as const;

export function WorkoutCard({
  workout: w,
  locale,
  t,
}: {
  workout: WorkoutListItem;
  locale: Locale;
  t: TFunction;
}) {
  const flames = LEVEL_FLAMES[w.level];
  return (
    <Link
      href={`/workouts/${w.id}`}
      className="group flex flex-col gap-3 rounded-md border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="flex h-24 items-center justify-center rounded-sm bg-accent-soft text-accent-text">
        <Dumbbell
          size={36}
          strokeWidth={1.5}
          className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
        />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold leading-tight">
          {localized(locale, w.title, w.titleEn)}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {t(`profile.places.${w.place}`)} · {t(`profile.goals.${w.goal}`)}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> {t("workouts.minutes", { n: w.durationMin })}
        </span>
        <span className="inline-flex items-center gap-1">
          <ListChecks size={14} /> {w.exerciseCount}
        </span>
        <span
          className="inline-flex items-center"
          role="img"
          aria-label={t(`profile.levels.${w.level}`)}
          title={t(`profile.levels.${w.level}`)}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <Flame
              key={i}
              size={16}
              className={i < flames ? "text-accent-text" : "text-line"}
              fill={i < flames ? "currentColor" : "none"}
            />
          ))}
        </span>
      </div>
    </Link>
  );
}

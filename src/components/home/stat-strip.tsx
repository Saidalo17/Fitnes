import { Flame, Scale } from "lucide-react";
import { WeekRing } from "@/components/gamification/week-ring";
import type { TFunction } from "@/i18n/translate";

type Props = {
  t: TFunction;
  streak: number;
  weightKg: number | null;
  weekDone: number;
  weekTarget: number;
};

function Stat({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-line bg-surface p-3 shadow-card">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon size={14} className={active ? "text-accent-text" : undefined} /> {label}
      </span>
      <span className="num text-xl leading-none">{value}</span>
    </div>
  );
}

/** Компактная полоса: серия, вес, прогресс недели. */
export function StatStrip({ t, streak, weightKg, weekDone, weekTarget }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat
        icon={Flame}
        label={t("home.streak")}
        value={t("home.streakDays", { n: streak })}
        active={streak > 0}
      />
      <Stat
        icon={Scale}
        label={t("home.weight")}
        value={weightKg == null ? "—" : `${weightKg} ${t("profile.units.kg")}`}
      />
      <div className="flex flex-col gap-1 rounded-md border border-line bg-surface p-3 shadow-card">
        <span className="text-xs font-medium text-muted">{t("home.week")}</span>
        <span className="flex items-center gap-2">
          <span className="max-[420px]:hidden">
            <WeekRing
              done={weekDone}
              target={weekTarget}
              size={32}
              label={t("home.weekProgress", { done: weekDone, target: weekTarget })}
            />
          </span>
          <span className="num whitespace-nowrap text-xl leading-none">
            {t("home.weekProgress", { done: weekDone, target: weekTarget })}
          </span>
        </span>
      </div>
    </div>
  );
}

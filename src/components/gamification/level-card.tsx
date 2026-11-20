import { Zap } from "lucide-react";
import type { TFunction } from "@/i18n/translate";
import { levelInfo } from "@/lib/xp";

/** Уровень и шкала опыта до следующего уровня. */
export function LevelCard({ xp, t }: { xp: number; t: TFunction }) {
  const info = levelInfo(xp);
  return (
    <div className="rounded-md border border-line bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-sm bg-accent-soft text-accent-text">
            <Zap size={16} />
          </span>
          {t("achievements.level", { n: info.level })}
        </span>
        <span className="num text-sm text-muted">
          {t("achievements.xpOf", { xp: info.xp, to: info.to })}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-sm bg-surface-2"
        role="progressbar"
        aria-label={t("achievements.level", { n: info.level })}
        aria-valuemin={info.from}
        aria-valuemax={info.to}
        aria-valuenow={info.xp}
      >
        <div
          className="h-full bg-accent transition-all duration-700"
          style={{ width: `${Math.round(info.progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

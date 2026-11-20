import { Lock } from "lucide-react";
import { AchievementIcon } from "@/components/gamification/achievement-icon";
import { LevelCard } from "@/components/gamification/level-card";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { getT } from "@/i18n/server";
import { listAchievements } from "@/lib/achievements-data";
import { cn } from "@/lib/cn";
import { requireOnboardedUser } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("achievements.title")} — Fitnes` };
}

export default async function AchievementsPage() {
  const { userId, profile } = await requireOnboardedUser();
  const { t, locale } = await getT();
  const items = await listAchievements(userId);
  const got = items.filter((i) => i.unlockedAt).length;
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <RevealGroup className="flex flex-col gap-6">
      <RevealItem>
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("achievements.title")}</h1>
        <p className="mt-1 text-muted">
          {t("achievements.progress", { n: got, total: items.length })}
        </p>
      </RevealItem>

      <RevealItem>
        <LevelCard xp={profile.xp} t={t} />
      </RevealItem>

      <RevealItem>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const unlocked = !!a.unlockedAt;
            return (
              <li
                key={a.code}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-4 shadow-card",
                  unlocked ? "border-accent/50 bg-surface" : "border-line bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full",
                    unlocked ? "bg-accent text-on-accent" : "bg-surface-2 text-muted",
                  )}
                >
                  {unlocked ? <AchievementIcon code={a.code} /> : <Lock size={20} />}
                </span>
                <div className="min-w-0">
                  <h2 className="font-sans text-base font-semibold leading-tight">
                    {t(`achievements.items.${a.code}.title`)}
                  </h2>
                  <p className="text-sm text-muted">{t(`achievements.items.${a.code}.desc`)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {unlocked
                      ? t("achievements.unlockedOn", { date: dateFmt.format(a.unlockedAt!) })
                      : t("achievements.locked")}
                    {a.xpBonus > 0 && (
                      <span className="num ml-2 text-accent-text">
                        {t("achievements.bonus", { n: a.xpBonus })}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </RevealItem>
    </RevealGroup>
  );
}

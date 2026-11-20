import { Suspense } from "react";
import { ChartCard } from "@/components/analytics/chart-card";
import { MuscleBars } from "@/components/analytics/muscle-bars";
import { RangeSwitcher } from "@/components/analytics/range-switcher";
import { ColumnChart } from "@/components/charts/column-chart";
import { GradientLineChart } from "@/components/charts/gradient-line-chart";
import { Card } from "@/components/ui/card";
import { localized } from "@/i18n/content";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/translate";
import { parseRange } from "@/lib/analytics";
import { getAnalytics } from "@/lib/analytics-data";
import { getTzOffset } from "@/lib/prefs";
import { requireOnboardedUser } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("analytics.title")} — Fitnes` };
}

function fmtDuration(sec: number, t: TFunction) {
  const m = Math.round(sec / 60);
  return m >= 60
    ? t("analytics.hm", { h: Math.floor(m / 60), m: m % 60 })
    : t("analytics.min", { n: m });
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="num mt-1 text-2xl leading-tight">{value}</div>
    </Card>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await requireOnboardedUser();
  const { t, locale } = await getT();
  const sp = await searchParams;
  const range = parseRange(Array.isArray(sp.range) ? sp.range[0] : sp.range);
  const data = await getAnalytics(userId, range, await getTzOffset());

  const dayFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const monthFmt = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
  const bucketLabel = (iso: string) =>
    (data.granularity === "month" ? monthFmt : dayFmt).format(new Date(iso));

  const kg = t("analytics.kg");
  const weight = data.weight.points.map((p) => ({
    label: dayFmt.format(new Date(p.t)),
    value: p.kg,
  }));
  const volume = data.volume.map((p) => ({ label: bucketLabel(p.t), value: p.value }));
  const counts = data.workouts.map((p) => ({ label: bucketLabel(p.t), value: p.value }));
  const noWorkouts = data.kpis.workouts === 0;
  const delta = data.weight.summary?.delta ?? 0;
  const emptyWorkouts = {
    text: t("analytics.emptyWorkouts"),
    href: "/workouts",
    cta: t("analytics.toWorkouts"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("analytics.title")}</h1>
        <Suspense>
          <RangeSwitcher value={range} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t("analytics.kpiWorkouts")} value={String(data.kpis.workouts)} />
        <Kpi label={t("analytics.kpiVolume")} value={`${data.kpis.volumeKg} ${kg}`} />
        <Kpi label={t("analytics.kpiTime")} value={fmtDuration(data.kpis.durationSec, t)} />
        <Kpi
          label={t("analytics.kpiStreak")}
          value={t("analytics.days", { n: data.kpis.streak })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          t={t}
          title={t("analytics.weightTitle")}
          subtitle={
            data.weight.summary
              ? t("analytics.weightChange", { delta: `${delta > 0 ? "+" : ""}${delta}` })
              : undefined
          }
          rows={weight.map((w) => ({ label: w.label, value: `${w.value} ${kg}` }))}
          empty={
            weight.length === 0
              ? {
                  text: t("analytics.emptyWeight"),
                  href: "/profile",
                  cta: t("analytics.toProfile"),
                }
              : undefined
          }
        >
          <GradientLineChart data={weight} unit={kg} />
        </ChartCard>

        <ChartCard
          t={t}
          title={t("analytics.volumeTitle")}
          subtitle={t("analytics.volumeHint")}
          rows={volume.map((v) => ({ label: v.label, value: `${v.value} ${kg}` }))}
          empty={noWorkouts ? emptyWorkouts : undefined}
        >
          <GradientLineChart data={volume} unit={kg} zeroBased />
        </ChartCard>

        <ChartCard
          t={t}
          title={t("analytics.workoutsTitle")}
          rows={counts.map((c) => ({ label: c.label, value: String(c.value) }))}
          empty={noWorkouts ? emptyWorkouts : undefined}
        >
          <ColumnChart data={counts} unit="" />
        </ChartCard>

        <ChartCard
          t={t}
          title={t("analytics.musclesTitle")}
          subtitle={t("analytics.musclesHint")}
          colLabel={t("analytics.colMuscle")}
          rows={data.muscles.map((m) => ({
            label: t(`profile.muscles.${m.muscle as "chest"}`),
            value: `${m.sets} ${t("analytics.sets")}`,
          }))}
          empty={noWorkouts ? emptyWorkouts : undefined}
        >
          <MuscleBars items={data.muscles} t={t} />
        </ChartCard>
      </div>

      <Card className="p-5">
        <h2 className="text-2xl font-bold">{t("analytics.recordsTitle")}</h2>
        <p className="mb-3 text-sm text-muted">{t("analytics.recordsHint")}</p>
        {data.records.length ? (
          <ul className="divide-y divide-line">
            {data.records.map((r) => (
              <li key={r.exerciseId} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="font-semibold">{localized(locale, r.name, r.nameEn)}</span>
                <span className="text-right">
                  <span className="num">
                    {t("analytics.recordLine", { kg: r.weightKg, reps: r.reps ?? 0 })}
                  </span>
                  <span className="ml-2 text-xs text-muted">{dayFmt.format(new Date(r.at))}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("analytics.emptyRecords")}</p>
        )}
      </Card>
    </div>
  );
}

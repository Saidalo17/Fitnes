import { Suspense } from "react";
import { WorkoutCard } from "@/components/workouts/workout-card";
import { WorkoutFilters } from "@/components/workouts/workout-filters";
import { getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { getRecommended, listWorkouts, parseFilters } from "@/lib/workouts";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("workouts.title")} — Fitnes` };
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId, profile } = await requireOnboardedUser();
  const { t, locale } = await getT();
  const filters = parseFilters(await searchParams);
  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  const [items, recommended] = await Promise.all([
    listWorkouts(filters),
    hasFilters || !profile.goal || !profile.place || !profile.level
      ? Promise.resolve([])
      : getRecommended(userId, {
          goal: profile.goal,
          focusMuscle: profile.focusMuscle,
          place: profile.place,
          level: profile.level,
        }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold lg:text-5xl">{t("workouts.title")}</h1>

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold">{t("workouts.recommended")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((w) => (
              <WorkoutCard key={w.id} workout={w} locale={locale} t={t} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t("workouts.allTitle")}</h2>
        <Suspense>
          <WorkoutFilters />
        </Suspense>
        <p className="text-sm text-muted">{t("workouts.found", { n: items.length })}</p>
        {items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => (
              <WorkoutCard key={w.id} workout={w} locale={locale} t={t} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-line p-10 text-center">
            <p className="text-lg font-semibold">{t("workouts.empty")}</p>
            <p className="mt-1 text-muted">{t("workouts.emptyHint")}</p>
          </div>
        )}
      </section>
    </div>
  );
}

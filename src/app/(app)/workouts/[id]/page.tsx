import { ArrowLeft, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseVideo } from "@/components/workouts/exercise-video";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localized } from "@/i18n/content";
import { getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { getWorkoutDetail } from "@/lib/workouts";

type Params = Promise<{ id: string }>;

async function load(params: Params) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const data = await getWorkoutDetail(id);
  if (!data) notFound();
  return data;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { workout } = await load(params);
  const { locale } = await getT();
  return { title: `${localized(locale, workout.title, workout.titleEn)} — Fitnes` };
}

export default async function WorkoutPage({ params }: { params: Params }) {
  await requireOnboardedUser();
  const { workout: w, items } = await load(params);
  const { t, locale } = await getT();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/workouts"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft size={16} /> {t("workouts.back")}
      </Link>

      <header>
        <h1 className="text-4xl font-extrabold lg:text-5xl">
          {localized(locale, w.title, w.titleEn)}
        </h1>
        <p className="mt-2 text-muted">{localized(locale, w.description, w.descriptionEn)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span>{t(`profile.places.${w.place}`)}</span>
          <span>{t(`profile.goals.${w.goal}`)}</span>
          {w.targetMuscle && <span>{t(`profile.muscles.${w.targetMuscle}`)}</span>}
          <span className="inline-flex items-center gap-1">
            <Flame size={14} className="text-accent-text" /> {t(`profile.levels.${w.level}`)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} /> {t("workouts.minutes", { n: w.durationMin })}
          </span>
        </div>
        <div className="mt-5">
          <Link href={`/workout/${w.id}/run`} className={buttonStyles()}>
            {t("workouts.start")}
          </Link>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-2xl font-bold">{t("workouts.exercisesTitle")}</h2>
        <ol className="flex flex-col gap-4">
          {items.map((it) => {
            const name = localized(locale, it.exercise.name, it.exercise.nameEn);
            return (
              <li key={it.id}>
                <Card className="grid gap-4 sm:grid-cols-[220px_1fr]">
                  <ExerciseVideo
                    src={it.exercise.videoUrl}
                    poster={it.exercise.posterUrl}
                    slug={it.exercise.slug}
                    muscle={it.exercise.muscleGroup}
                    label={name}
                  />
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-xl font-bold">
                      <span className="num mr-2 text-accent-text">{it.position}.</span>
                      {name}
                    </h3>
                    <p className="text-sm font-semibold">
                      {it.durationSec
                        ? t("workouts.setsTime", { sets: it.sets, sec: it.durationSec })
                        : t("workouts.setsReps", { sets: it.sets, reps: it.reps ?? 0 })}
                      <span className="ml-2 font-normal text-muted">
                        · {t("workouts.rest", { n: it.restSec })}
                      </span>
                    </p>
                    {(it.exercise.tips || it.exercise.tipsEn) && (
                      <p className="text-sm text-muted">
                        <span className="font-semibold text-fg">{t("workouts.tips")}: </span>
                        {localized(locale, it.exercise.tips ?? "", it.exercise.tipsEn)}
                      </p>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

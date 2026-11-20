import { notFound } from "next/navigation";
import { WorkoutRunner, type RunItem } from "@/components/workouts/workout-runner";
import { localized } from "@/i18n/content";
import { getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { getWorkoutDetail } from "@/lib/workouts";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const data = Number.isInteger(id) ? await getWorkoutDetail(id) : null;
  const { locale } = await getT();
  return {
    title: data
      ? `${localized(locale, data.workout.title, data.workout.titleEn)} — Fitnes`
      : "Fitnes",
  };
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOnboardedUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const data = await getWorkoutDetail(id);
  if (!data || data.items.length === 0) notFound();
  const { locale } = await getT();

  const items: RunItem[] = data.items.map((it) => ({
    exerciseId: it.exercise.id,
    name: localized(locale, it.exercise.name, it.exercise.nameEn),
    tips: it.exercise.tips ? localized(locale, it.exercise.tips, it.exercise.tipsEn) : null,
    videoUrl: it.exercise.videoUrl,
    posterUrl: it.exercise.posterUrl,
    usesWeight: it.exercise.equipment !== "none" && !it.durationSec,
    sets: it.sets,
    reps: it.reps,
    durationSec: it.durationSec,
    restSec: it.restSec,
  }));

  return (
    <WorkoutRunner
      workoutId={id}
      title={localized(locale, data.workout.title, data.workout.titleEn)}
      items={items}
    />
  );
}

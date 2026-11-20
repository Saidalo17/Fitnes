import {
  Activity,
  Dumbbell,
  Flame,
  House,
  Target,
  TrendingUp,
  Bot,
  ChartLine,
  Trophy,
  Utensils,
} from "lucide-react";
import { CategoryTile } from "@/components/home/category-tile";
import { StatStrip } from "@/components/home/stat-strip";
import { LevelCard } from "@/components/gamification/level-card";
import { PeopleSearch } from "@/components/social/people-search";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { WorkoutCard } from "@/components/workouts/workout-card";
import { getT } from "@/i18n/server";
import { getTzOffset } from "@/lib/prefs";
import { levelInfo } from "@/lib/xp";
import { requireOnboardedUser } from "@/lib/session";
import { getSocialBadge } from "@/lib/social-data";
import { getActivityStats } from "@/lib/stats";
import { getCatalogCounts, getRecommended } from "@/lib/workouts";

const MUSCLES = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "abs",
  "glutes",
  "full_body",
] as const;

export default async function HomePage() {
  const { userId, profile, name } = await requireOnboardedUser();
  const { t, locale } = await getT();

  const [stats, counts, recommended, badge] = await Promise.all([
    getActivityStats(userId, await getTzOffset()),
    getCatalogCounts(),
    profile.goal && profile.place && profile.level
      ? getRecommended(userId, {
          goal: profile.goal,
          focusMuscle: profile.focusMuscle,
          place: profile.place,
          level: profile.level,
        })
      : Promise.resolve([]),
    getSocialBadge(userId),
  ]);

  const firstName = name?.trim().split(" ")[0];
  const count = (n?: number) => t("home.count", { n: n ?? 0 });

  return (
    <RevealGroup className="flex flex-col gap-8">
      <RevealItem>
        <h1 className="text-4xl font-extrabold lg:text-5xl">
          {firstName ? t("home.greeting", { name: firstName }) : t("home.greetingNoName")}
        </h1>
        <p className="mt-1 text-muted">{t("home.subtitle")}</p>
      </RevealItem>

      <RevealItem>
        <StatStrip
          t={t}
          streak={stats.streak}
          weightKg={profile.weightKg}
          weekDone={stats.weekDone}
          weekTarget={profile.weeklyTarget ?? 3}
        />
      </RevealItem>

      <RevealItem>
        <LevelCard xp={profile.xp} t={t} />
      </RevealItem>

      <RevealItem>
        <PeopleSearch showFriendsLink requests={badge.requests} />
      </RevealItem>

      <RevealItem>
        <h2 className="mb-3 text-2xl font-bold">{t("home.whereTitle")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <CategoryTile
            large
            href="/workouts?place=gym"
            icon={Dumbbell}
            title={t("profile.places.gym")}
            hint={count(counts.place.gym)}
          />
          <CategoryTile
            large
            href="/workouts?place=home"
            icon={House}
            title={t("profile.places.home")}
            hint={count(counts.place.home)}
          />
        </div>
      </RevealItem>

      <RevealItem>
        <h2 className="mb-3 text-2xl font-bold">{t("home.goalTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <CategoryTile
            href="/workouts?goal=lose_weight"
            icon={Flame}
            title={t("profile.goals.lose_weight")}
            hint={count(counts.goal.lose_weight)}
          />
          <CategoryTile
            href="/workouts?goal=gain_weight"
            icon={TrendingUp}
            title={t("profile.goals.gain_weight")}
            hint={count(counts.goal.gain_weight)}
          />
          <CategoryTile
            href="/workouts?goal=build_muscle"
            icon={Target}
            title={t("profile.goals.build_muscle")}
            hint={count(counts.goal.build_muscle)}
          />
        </div>
      </RevealItem>

      <RevealItem>
        <h2 className="mb-3 text-2xl font-bold">{t("home.muscleTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MUSCLES.map((m) => (
            <CategoryTile
              key={m}
              href={`/workouts?muscle=${m}`}
              icon={Activity}
              title={t(`profile.muscles.${m}`)}
              hint={count(counts.muscle[m])}
            />
          ))}
        </div>
      </RevealItem>

      <RevealItem>
        <h2 className="mb-3 text-2xl font-bold">{t("home.moreTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CategoryTile
            href="/nutrition"
            icon={Utensils}
            title={t("nav.nutrition")}
            hint={t("nutrition.subtitle")}
          />
          <CategoryTile
            href="/coach"
            icon={Bot}
            title={t("coach.title")}
            hint={t("coach.subtitle")}
          />
          <CategoryTile
            href="/analytics"
            icon={ChartLine}
            title={t("nav.analytics")}
            hint={t("analytics.volumeHint")}
          />
          <CategoryTile
            href="/achievements"
            icon={Trophy}
            title={t("nav.achievements")}
            hint={t("achievements.level", { n: levelInfo(profile.xp).level })}
          />
        </div>
      </RevealItem>

      {recommended.length > 0 && (
        <RevealItem>
          <h2 className="mb-3 text-2xl font-bold">{t("workouts.recommended")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((w) => (
              <WorkoutCard key={w.id} workout={w} locale={locale} t={t} />
            ))}
          </div>
        </RevealItem>
      )}
    </RevealGroup>
  );
}

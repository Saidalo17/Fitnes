"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Chip } from "@/components/ui/chip";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

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
const DURATIONS = [15, 30, 45, 60] as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function WorkoutFilters() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  const is = (key: string, value: string) => sp.get(key) === value;
  const hasAny = ["place", "goal", "muscle", "level", "duration"].some((k) => sp.has(k));

  return (
    <div className={cn("flex flex-col gap-4", pending && "opacity-70")}>
      <Row label={t("workouts.filters.place")}>
        {(["gym", "home"] as const).map((p) => (
          <Chip key={p} active={is("place", p)} onClick={() => toggle("place", p)}>
            {t(`profile.places.${p}`)}
          </Chip>
        ))}
      </Row>
      <Row label={t("workouts.filters.goal")}>
        {(["lose_weight", "gain_weight", "build_muscle"] as const).map((g) => (
          <Chip key={g} active={is("goal", g)} onClick={() => toggle("goal", g)}>
            {t(`profile.goals.${g}`)}
          </Chip>
        ))}
      </Row>
      <Row label={t("workouts.filters.muscle")}>
        {MUSCLES.map((m) => (
          <Chip key={m} active={is("muscle", m)} onClick={() => toggle("muscle", m)}>
            {t(`profile.muscles.${m}`)}
          </Chip>
        ))}
      </Row>
      <Row label={t("workouts.filters.level")}>
        {(["beginner", "intermediate", "advanced"] as const).map((l) => (
          <Chip key={l} active={is("level", l)} onClick={() => toggle("level", l)}>
            {t(`profile.levels.${l}`)}
          </Chip>
        ))}
      </Row>
      <Row label={t("workouts.filters.duration")}>
        {DURATIONS.map((d) => (
          <Chip
            key={d}
            active={is("duration", String(d))}
            onClick={() => toggle("duration", String(d))}
          >
            {t("workouts.durationUpTo", { n: d })}
          </Chip>
        ))}
      </Row>
      {hasAny && (
        <button
          type="button"
          onClick={() => start(() => router.replace(pathname, { scroll: false }))}
          className="self-start text-sm font-semibold text-accent-text underline"
        >
          {t("workouts.filters.reset")}
        </button>
      )}
    </div>
  );
}

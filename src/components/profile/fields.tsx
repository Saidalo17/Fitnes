"use client";

import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/i18n/client";
import { bmi, bmiCategory, suggestedGoal } from "@/lib/bmi";
import { cn } from "@/lib/cn";
import type { ProfileInput } from "@/lib/validators";

export type Draft = {
  sex: ProfileInput["sex"] | "";
  birthYear: number;
  heightCm: number;
  weightKg: number;
  goal: ProfileInput["goal"] | "";
  focusMuscle: NonNullable<ProfileInput["focusMuscle"]> | "";
  place: ProfileInput["place"] | "";
  level: ProfileInput["level"] | "";
  weeklyTarget: number;
};

export const emptyDraft: Draft = {
  sex: "",
  birthYear: 1995,
  heightCm: 175,
  weightKg: 70,
  goal: "",
  focusMuscle: "",
  place: "",
  level: "",
  weeklyTarget: 3,
};

export type Errors = Record<string, string[] | undefined>;
type Props = { draft: Draft; set: (patch: Partial<Draft>) => void; errors?: Errors };

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

function ErrorText({ msg }: { msg?: string }) {
  return msg ? (
    <p role="alert" className="mt-1.5 text-sm text-danger-text">
      {msg}
    </p>
  ) : null;
}

function Group({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      {children}
      <ErrorText msg={error} />
    </fieldset>
  );
}

function OptionCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex min-h-14 flex-col items-start justify-center rounded-md border-2 px-4 py-3 text-left transition active:scale-[0.98]",
        active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2",
      )}
    >
      <span className="font-semibold">{title}</span>
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </button>
  );
}

export function AboutFields({ draft, set, errors }: Props) {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <Group label={t("profile.fields.sex")} error={errors?.sex?.[0]}>
        <div role="radiogroup" className="grid grid-cols-3 gap-2">
          {(["male", "female", "other"] as const).map((s) => (
            <OptionCard
              key={s}
              active={draft.sex === s}
              title={t(`profile.sexes.${s}`)}
              onClick={() => set({ sex: s })}
            />
          ))}
        </div>
      </Group>
      <Input
        type="number"
        inputMode="numeric"
        label={t("profile.fields.birthYear")}
        value={draft.birthYear}
        onChange={(e) => set({ birthYear: Number(e.target.value) })}
        error={errors?.birthYear?.[0]}
      />
    </div>
  );
}

export function HeightField({ draft, set, errors }: Props) {
  const t = useT();
  return (
    <div>
      <Slider
        label={t("profile.fields.height")}
        value={draft.heightCm}
        onChange={(v) => set({ heightCm: v })}
        min={100}
        max={250}
        unit={t("profile.units.cm")}
      />
      <ErrorText msg={errors?.heightCm?.[0]} />
    </div>
  );
}

export function WeightField({ draft, set, errors }: Props) {
  const t = useT();
  return (
    <div>
      <Slider
        label={t("profile.fields.weight")}
        value={draft.weightKg}
        onChange={(v) => set({ weightKg: v })}
        min={30}
        max={300}
        step={0.5}
        unit={t("profile.units.kg")}
      />
      <ErrorText msg={errors?.weightKg?.[0]} />
    </div>
  );
}

export function BmiBadge({ draft }: { draft: Draft }) {
  const t = useT();
  const value = bmi(draft.weightKg, draft.heightCm);
  return (
    <p className="text-center text-sm text-muted">
      {t("profile.bmi")}: <span className="num text-fg">{value}</span> ·{" "}
      {t(`profile.bmiCategories.${bmiCategory(value)}`)}
    </p>
  );
}

export function GoalFields({ draft, set, errors }: Props) {
  const t = useT();
  const hint = suggestedGoal(bmi(draft.weightKg, draft.heightCm));
  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-sm bg-surface-2 p-3 text-sm text-muted">
        {t("profile.suggest", { goal: t(`profile.goals.${hint}`) })}
      </p>
      <Group label={t("profile.fields.goal")} error={errors?.goal?.[0]}>
        <div role="radiogroup" className="grid gap-2">
          {(["lose_weight", "gain_weight", "build_muscle"] as const).map((g) => (
            <OptionCard
              key={g}
              active={draft.goal === g}
              title={t(`profile.goals.${g}`)}
              hint={t(`profile.goalHints.${g}`)}
              onClick={() => set({ goal: g })}
            />
          ))}
        </div>
      </Group>
      {draft.goal === "build_muscle" && (
        <Group label={t("profile.fields.focus")} error={errors?.focusMuscle?.[0]}>
          <div className="flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <Chip
                key={m}
                active={draft.focusMuscle === m}
                onClick={() => set({ focusMuscle: m })}
              >
                {t(`profile.muscles.${m}`)}
              </Chip>
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}

export function PlaceFields({ draft, set, errors }: Props) {
  const t = useT();
  return (
    <Group label={t("profile.fields.place")} error={errors?.place?.[0]}>
      <div role="radiogroup" className="grid gap-2">
        {(["gym", "home", "both"] as const).map((p) => (
          <OptionCard
            key={p}
            active={draft.place === p}
            title={t(`profile.places.${p}`)}
            onClick={() => set({ place: p })}
          />
        ))}
      </div>
    </Group>
  );
}

export function LevelFields({ draft, set, errors }: Props) {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <Group label={t("profile.fields.level")} error={errors?.level?.[0]}>
        <div role="radiogroup" className="grid gap-2">
          {(["beginner", "intermediate", "advanced"] as const).map((l) => (
            <OptionCard
              key={l}
              active={draft.level === l}
              title={t(`profile.levels.${l}`)}
              onClick={() => set({ level: l })}
            />
          ))}
        </div>
      </Group>
      <Group label={t("profile.fields.weeklyTarget")}>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Chip
              key={n}
              active={draft.weeklyTarget === n}
              onClick={() => set({ weeklyTarget: n })}
              className="min-w-0 flex-1 justify-center px-0"
            >
              {n}
            </Chip>
          ))}
        </div>
      </Group>
    </div>
  );
}

/** Черновик → вход Server Action (пустые значения не пройдут валидацию). */
export function draftToInput(d: Draft): ProfileInput {
  return {
    ...d,
    focusMuscle: d.goal === "build_muscle" && d.focusMuscle ? d.focusMuscle : null,
  } as ProfileInput;
}

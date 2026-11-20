"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/client";
import {
  AboutFields,
  BmiBadge,
  draftToInput,
  emptyDraft,
  GoalFields,
  HeightField,
  LevelFields,
  PlaceFields,
  WeightField,
  type Draft,
  type Errors,
} from "./fields";

const STEPS = ["about", "body", "goal", "place", "level"] as const;
// какие поля относятся к какому шагу (чтобы вернуть на шаг с ошибкой)
const STEP_FIELDS: Record<(typeof STEPS)[number], string[]> = {
  about: ["sex", "birthYear"],
  body: ["heightCm", "weightKg"],
  goal: ["goal", "focusMuscle"],
  place: ["place"],
  level: ["level"],
};

export function OnboardingWizard({ initial }: { initial?: Partial<Draft> }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft, ...initial });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, start] = useTransition();

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    // убираем ошибки у полей, которые пользователь только что изменил
    setErrors((e) => {
      const rest = { ...e };
      for (const k of Object.keys(patch)) delete rest[k];
      return rest;
    });
  };
  const key = STEPS[step];
  const last = step === STEPS.length - 1;

  function submit() {
    start(async () => {
      const res = await saveProfile(draftToInput(draft));
      if (res.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const fe = res.fieldErrors ?? {};
      setErrors(fe);
      setFormError(res.error);
      const bad = STEPS.findIndex((s) => STEP_FIELDS[s].some((f) => fe[f]));
      if (bad >= 0) setStep(bad);
    });
  }

  function next() {
    const missing: Errors = {};
    if (key === "about" && !draft.sex) missing.sex = [t("validation.required")];
    if (key === "goal") {
      if (!draft.goal) missing.goal = [t("validation.required")];
      else if (draft.goal === "build_muscle" && !draft.focusMuscle)
        missing.focusMuscle = [t("validation.focusRequired")];
    }
    if (key === "place" && !draft.place) missing.place = [t("validation.required")];
    if (key === "level" && !draft.level) missing.level = [t("validation.required")];
    if (Object.keys(missing).length) return setErrors(missing);
    setErrors({});
    if (last) submit();
    else setStep((s) => s + 1);
  }

  const stepLabel = t("onboarding.stepOf", { n: step + 1, total: STEPS.length });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="text-4xl font-extrabold">{t("onboarding.title")}</h1>
      <p className="mt-2 text-muted">{t("onboarding.subtitle")}</p>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted">
          <span>{stepLabel}</span>
          <span className="font-semibold text-fg">{t(`onboarding.steps.${key}`)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-sm bg-surface-2">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      <Card className="mt-6 p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
          >
            {key === "about" && <AboutFields draft={draft} set={set} errors={errors} />}
            {key === "body" && (
              <div className="flex flex-col gap-8">
                <HeightField draft={draft} set={set} errors={errors} />
                <WeightField draft={draft} set={set} errors={errors} />
                <BmiBadge draft={draft} />
              </div>
            )}
            {key === "goal" && <GoalFields draft={draft} set={set} errors={errors} />}
            {key === "place" && <PlaceFields draft={draft} set={set} errors={errors} />}
            {key === "level" && <LevelFields draft={draft} set={set} errors={errors} />}
          </motion.div>
        </AnimatePresence>
        {formError && (
          <p role="alert" className="mt-4 text-sm text-danger-text">
            {formError}
          </p>
        )}
      </Card>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={pending}>
            {t("onboarding.back")}
          </Button>
        )}
        <Button className="flex-1" onClick={next} disabled={pending}>
          {pending ? t("common.wait") : last ? t("onboarding.finish") : t("onboarding.next")}
        </Button>
      </div>
    </div>
  );
}

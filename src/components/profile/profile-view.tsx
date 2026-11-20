"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccount, logWeight, saveProfile, setReduceEffects } from "@/actions/profile";
import { AchievementModal, type UnlockedItem } from "@/components/gamification/achievement-modal";
import { LevelCard } from "@/components/gamification/level-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/i18n/client";
import {
  AboutFields,
  BmiBadge,
  draftToInput,
  GoalFields,
  HeightField,
  LevelFields,
  PlaceFields,
  WeightField,
  type Draft,
  type Errors,
} from "./fields";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-5 p-5">
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </Card>
  );
}

type Note = { kind: "ok" | "err"; text: string };

function Msg({ m }: { m?: Note }) {
  return m ? (
    <p
      role="status"
      className={m.kind === "ok" ? "text-sm text-success" : "text-sm text-danger-text"}
    >
      {m.text}
    </p>
  ) : null;
}

export function ProfileView({
  initial,
  name,
  email,
  xp,
  reduceEffects,
}: {
  initial: Draft;
  name: string;
  email: string;
  xp: number;
  reduceEffects: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [savedWeight, setSavedWeight] = useState(initial.weightKg);
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string }>();
  const [weightMsg, setWeightMsg] = useState<{ kind: "ok" | "err"; text: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<UnlockedItem[]>([]);
  const [effectsOff, setEffectsOff] = useState(reduceEffects);
  const [pending, start] = useTransition();

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  function save() {
    start(async () => {
      const res = await saveProfile(draftToInput({ ...draft, weightKg: savedWeight }));
      setErrors(res.fieldErrors ?? {});
      setMsg(
        res.ok
          ? { kind: "ok", text: t("profile.saved") }
          : {
              kind: "err",
              text:
                res.error ?? Object.values(res.fieldErrors ?? {})[0]?.[0] ?? t("errors.generic"),
            },
      );
      if (res.ok) router.refresh();
    });
  }

  function saveWeight() {
    start(async () => {
      const res = await logWeight(draft.weightKg);
      if (res.ok) {
        setSavedWeight(draft.weightKg);
        setWeightMsg({ kind: "ok", text: t("profile.saved") });
        if (res.unlocked?.length) setUnlocked(res.unlocked);
        router.refresh();
      } else setWeightMsg({ kind: "err", text: res.error ?? t("errors.generic") });
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("profile.title")}</h1>
        <p className="mt-1 text-muted">
          {name} · {email}
        </p>
      </div>

      <LevelCard xp={xp} t={t} />

      <Section title={t("profile.weightCard")}>
        <WeightField draft={draft} set={set} errors={errors} />
        <BmiBadge draft={draft} />
        <div className="flex items-center gap-3">
          <Button onClick={saveWeight} disabled={pending || draft.weightKg === savedWeight}>
            {t("profile.logWeight")}
          </Button>
          <Msg m={weightMsg} />
        </div>
      </Section>

      <Section title={t("profile.title")}>
        <AboutFields draft={draft} set={set} errors={errors} />
        <HeightField draft={draft} set={set} errors={errors} />
        <GoalFields draft={draft} set={set} errors={errors} />
        <PlaceFields draft={draft} set={set} errors={errors} />
        <LevelFields draft={draft} set={set} errors={errors} />
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending}>
            {pending ? t("common.wait") : t("profile.save")}
          </Button>
          <Msg m={msg} />
        </div>
      </Section>

      <Section title={t("profile.appearance")}>
        <div className="flex flex-wrap gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">{t("profile.effects")}</div>
            <div className="text-sm text-muted">{t("profile.effectsHint")}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!effectsOff}
            aria-label={t("profile.effects")}
            onClick={() => {
              const next = !effectsOff;
              setEffectsOff(next);
              start(async () => {
                await setReduceEffects(next);
                router.refresh();
              });
            }}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${effectsOff ? "bg-surface-2 border border-line" : "bg-accent"}`}
          >
            <span
              className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${effectsOff ? "left-0.5" : "left-[22px]"}`}
            />
          </button>
        </div>
      </Section>

      <Section title={t("profile.account")}>
        <div className="flex flex-wrap gap-3">
          <LogoutButton withLabel />
        </div>
        <div className="border-t border-line pt-5">
          <h3 className="mb-3 font-sans text-sm font-semibold text-danger-text">
            {t("profile.danger")}
          </h3>
          <Button
            variant="secondary"
            className="border-danger text-danger-text"
            onClick={() => setConfirmOpen(true)}
          >
            {t("profile.deleteAccount")}
          </Button>
        </div>
      </Section>

      <AchievementModal items={unlocked} onClose={() => setUnlocked([])} />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("profile.deleteTitle")}
      >
        <p className="mb-5 text-muted">{t("profile.deleteText")}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            {t("profile.cancel")}
          </Button>
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            disabled={pending}
            onClick={() => start(() => deleteAccount())}
          >
            {t("profile.confirmDelete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

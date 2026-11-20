"use client";

import { Check, ChevronLeft, Timer } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  finishSession,
  saveSet,
  startSession,
  type FinishSummary,
  type SavedSet,
} from "@/actions/session";
import { Button, buttonStyles } from "@/components/ui/button";
import { AchievementModal } from "@/components/gamification/achievement-modal";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { effectsAllowed } from "@/lib/effects";
import { ExerciseVideo } from "./exercise-video";

export type RunItem = {
  exerciseId: number;
  name: string;
  tips: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  slug: string;
  muscle: string;
  usesWeight: boolean;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  restSec: number;
};

type SetState = { reps: number | null; weightKg: number | null; completed: boolean };
type Phase = "loading" | "run" | "finishing" | "summary" | "error";

const key = (exerciseId: number, n: number) => `${exerciseId}:${n}`;

function buildInitial(items: RunItem[]) {
  const out: Record<string, SetState> = {};
  for (const it of items)
    for (let n = 1; n <= it.sets; n++)
      out[key(it.exerciseId, n)] = { reps: it.reps, weightKg: null, completed: false };
  return out;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

export function WorkoutRunner({
  workoutId,
  title,
  items,
}: {
  workoutId: number;
  title: string;
  items: RunItem[];
}) {
  const t = useT();
  const draftKey = `fitnes:run:${workoutId}`;

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sets, setSets] = useState<Record<string, SetState>>(() => buildInitial(items));
  const [exIndex, setExIndex] = useState(0);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [summary, setSummary] = useState<FinishSummary>();
  const [showUnlocked, setShowUnlocked] = useState(true);
  const synced = useRef<Set<string>>(new Set());
  const started = useRef(false);

  // ---- старт / продолжение сессии + локальный черновик ----
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const res = await startSession(workoutId);
      if (!res.ok) return setPhase("error");
      const merged = buildInitial(items);
      let index = 0;

      // черновик из localStorage (если относится к этой же сессии)
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const d = JSON.parse(raw) as {
            sessionId: number;
            sets: Record<string, SetState>;
            exIndex: number;
          };
          if (d.sessionId === res.sessionId) {
            Object.assign(merged, d.sets);
            index = Math.min(d.exIndex, items.length - 1);
          }
        }
      } catch {
        /* черновик необязателен */
      }
      // данные сервера главнее
      res.sets.forEach((s: SavedSet) => {
        const k = key(s.exerciseId, s.setNumber);
        merged[k] = { reps: s.reps, weightKg: s.weightKg, completed: s.completed };
        if (s.completed) synced.current.add(k);
      });
      setSets(merged);
      setExIndex(index);
      setSessionId(res.sessionId);
      setPhase("run");
    })().catch(() => setPhase("error"));
  }, [workoutId, items, draftKey]);

  useEffect(() => {
    if (sessionId == null || phase !== "run") return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ sessionId, sets, exIndex }));
    } catch {
      /* квота/приватный режим */
    }
  }, [sessionId, sets, exIndex, phase, draftKey]);

  // ---- таймер отдыха ----
  useEffect(() => {
    if (restEndsAt == null) return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= restEndsAt) setRestEndsAt(null);
    }, 250);
    return () => clearInterval(id);
  }, [restEndsAt]);

  const item = items[exIndex];
  const nextIncomplete = useMemo(() => {
    for (let n = 1; n <= item.sets; n++) if (!sets[key(item.exerciseId, n)]?.completed) return n;
    return null;
  }, [item, sets]);

  const completedTotal = Object.values(sets).filter((s) => s.completed).length;
  const totalSets = items.reduce((a, i) => a + i.sets, 0);

  const patchSet = (n: number, patch: Partial<SetState>) =>
    setSets((prev) => {
      const k = key(item.exerciseId, n);
      return { ...prev, [k]: { ...prev[k], ...patch } };
    });

  const doFinish = useCallback(
    async (current: Record<string, SetState>) => {
      if (sessionId == null) return;
      setPhase("finishing");
      try {
        // досылаем несохранённые подходы (например, после обрыва связи)
        for (const it of items)
          for (let n = 1; n <= it.sets; n++) {
            const k = key(it.exerciseId, n);
            const s = current[k];
            if (s?.completed && !synced.current.has(k)) {
              const r = await saveSet({ sessionId, exerciseId: it.exerciseId, setNumber: n, ...s });
              if (!r.ok) throw new Error("save");
              synced.current.add(k);
            }
          }
        const res = await finishSession(sessionId);
        if (!res.ok) throw new Error("finish");
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
        setSummary(res.summary);
        setPhase("summary");
      } catch {
        setPhase("error");
      }
    },
    [sessionId, items, draftKey],
  );

  function completeSet() {
    if (sessionId == null || nextIncomplete == null) return;
    const n = nextIncomplete;
    const k = key(item.exerciseId, n);
    const cur = sets[k];
    const done: SetState = { ...cur, completed: true };
    const updated = { ...sets, [k]: done };
    // следующий подход наследует вес, если он ещё не задан
    const nk = key(item.exerciseId, n + 1);
    if (item.usesWeight && updated[nk] && updated[nk].weightKg == null && done.weightKg != null) {
      updated[nk] = { ...updated[nk], weightKg: done.weightKg };
    }
    setSets(updated);

    saveSet({ sessionId, exerciseId: item.exerciseId, setNumber: n, ...done })
      .then((r) => r.ok && synced.current.add(k))
      .catch(() => {
        /* останется несохранённым — досылается при завершении */
      });

    const exerciseDone = n === item.sets;
    const lastExercise = exIndex === items.length - 1;
    if (exerciseDone && lastExercise) return void doFinish(updated);

    setRestEndsAt(Date.now() + item.restSec * 1000);
    setNow(Date.now());
    if (exerciseDone) setExIndex((i) => i + 1);
  }

  function skipExercise() {
    setRestEndsAt(null);
    if (exIndex === items.length - 1) void doFinish(sets);
    else setExIndex((i) => i + 1);
  }

  // ---- конфетти на итоговом экране ----
  useEffect(() => {
    if (phase !== "summary") return;
    if (!effectsAllowed()) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      const colors = ["#e8450a", "#ff5a1f", "#e8a30a", "#ffffff"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
    });
  }, [phase]);

  // ---------------- UI ----------------
  if (phase === "loading") return <Center>{t("run.starting")}</Center>;

  if (phase === "finishing") return <Center>{t("run.finishing")}</Center>;

  if (phase === "error")
    return (
      <Center>
        <p className="max-w-xs text-center text-danger-text">{t("run.error")}</p>
        <div className="flex gap-3">
          <Button onClick={() => (sessionId == null ? location.reload() : void doFinish(sets))}>
            {t("run.retry")}
          </Button>
          <Link href={`/workouts/${workoutId}`} className={buttonStyles("secondary")}>
            {t("run.quit")}
          </Link>
        </div>
      </Center>
    );

  if (phase === "summary" && summary)
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">{t("run.summaryTitle")}</h1>
          <p className="mt-1 text-muted">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("run.time")} value={fmtTime(summary.durationSec)} />
          <Stat label={t("run.sets")} value={`${summary.completedSets}/${summary.totalSets}`} />
          <Stat label={t("run.volume")} value={`${summary.volumeKg} ${t("profile.units.kg")}`} />
          <Stat label={t("run.xp")} value={`+${summary.xpEarned}`} accent />
        </div>
        <Card>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">{t("run.level", { n: summary.level })}</span>
            <span className="num text-muted">{summary.totalXp} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-surface-2">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: `${Math.round(summary.levelProgress * 100)}%` }}
            />
          </div>
        </Card>
        <AchievementModal
          items={showUnlocked ? summary.unlocked : []}
          onClose={() => setShowUnlocked(false)}
        />
        <div className="flex gap-3">
          <Link href="/workouts" className={buttonStyles("secondary", "md", "flex-1")}>
            {t("run.toWorkouts")}
          </Link>
          <Link href="/" className={buttonStyles("primary", "md", "flex-1")}>
            {t("run.toHome")}
          </Link>
        </div>
      </main>
    );

  const resting = restEndsAt != null && restEndsAt > now;
  const restLeft = resting ? Math.ceil((restEndsAt! - now) / 1000) : 0;
  const isLastSet = exIndex === items.length - 1 && nextIncomplete === item.sets;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-32 pt-4">
      <header className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/workouts/${workoutId}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg"
          >
            <ChevronLeft size={16} /> {t("run.quit")}
          </Link>
          <span className="text-sm text-muted">
            {t("run.exerciseOf", { n: exIndex + 1, total: items.length })}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-sm bg-surface-2"
          role="progressbar"
          aria-label={t("run.progress")}
          aria-valuemin={0}
          aria-valuemax={totalSets}
          aria-valuenow={completedTotal}
        >
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(completedTotal / totalSets) * 100}%` }}
          />
        </div>
      </header>

      <h1 className="mb-3 text-3xl font-extrabold leading-tight">{item.name}</h1>
      <ExerciseVideo
        key={item.exerciseId}
        src={item.videoUrl}
        poster={item.posterUrl}
        slug={item.slug}
        muscle={item.muscle}
        label={item.name}
      />
      {item.tips && <p className="mt-3 text-sm text-muted">{item.tips}</p>}

      <ul className="mt-5 flex flex-col gap-2">
        {Array.from({ length: item.sets }, (_, i) => i + 1).map((n) => {
          const s = sets[key(item.exerciseId, n)];
          const isCurrent = n === nextIncomplete;
          return (
            <li
              key={n}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 transition",
                s.completed
                  ? "border-success/40 bg-surface-2"
                  : isCurrent
                    ? "border-accent bg-surface"
                    : "border-line bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-sm text-sm font-bold",
                  s.completed ? "bg-success text-white" : "bg-surface-2",
                )}
              >
                {s.completed ? <Check size={16} /> : n}
              </span>
              <span className="min-w-14 text-sm font-semibold">{t("run.setN", { n })}</span>
              {item.durationSec ? (
                <span className="num ml-auto">{t("run.seconds", { n: item.durationSec })}</span>
              ) : (
                <div className="ml-auto flex items-center gap-2">
                  <NumField
                    label={t("run.reps")}
                    value={s.reps}
                    disabled={s.completed}
                    onChange={(v) => patchSet(n, { reps: v == null ? null : Math.round(v) })}
                  />
                  {item.usesWeight && (
                    <NumField
                      label={t("run.weight")}
                      value={s.weightKg}
                      step={0.5}
                      disabled={s.completed}
                      onChange={(v) => patchSet(n, { weightKg: v })}
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={skipExercise}
        className="mt-4 self-center text-sm font-semibold text-muted underline"
      >
        {t("run.skipExercise")}
      </button>

      {/* Нижняя панель: кнопка в зоне большого пальца */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          {resting ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <Timer size={14} /> {t("run.rest")}
                </div>
                <div className="num text-3xl leading-tight" aria-live="polite">
                  {fmtTime(restLeft)}
                </div>
                {items[exIndex] && nextIncomplete === 1 && exIndex > 0 && (
                  <div className="truncate text-xs text-muted">
                    {t("run.nextUp", { name: item.name })}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRestEndsAt(restEndsAt! + 15000)}
              >
                {t("run.restAdd")}
              </Button>
              <Button size="sm" onClick={() => setRestEndsAt(null)}>
                {t("run.restSkip")}
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={completeSet} disabled={nextIncomplete == null}>
              {isLastSet ? t("run.finish") : t("run.done")}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-muted">
      {children}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4 text-center shadow-card">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={cn("num mt-1 text-2xl", accent && "text-accent-text")}>{value}</div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col items-center text-[10px] font-medium uppercase tracking-wider text-muted">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="num mt-0.5 h-10 w-16 rounded-sm bg-surface-2 text-center text-base normal-case tracking-normal text-fg outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
      />
    </label>
  );
}

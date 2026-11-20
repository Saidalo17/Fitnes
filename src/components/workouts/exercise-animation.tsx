"use client";

import { useEffect, useId, useRef } from "react";
import { effectsAllowed } from "@/lib/effects";

type P = [number, number];
type Pose = {
  head: P;
  sh: P;
  hip: P;
  elbow: P;
  hand: P;
  kA: P;
  fA: P;
  kB: P;
  fB: P;
};
type Kind =
  | "squat"
  | "lunge"
  | "pushup"
  | "pullup"
  | "bench"
  | "row"
  | "press"
  | "curl"
  | "calf"
  | "crunch"
  | "superman"
  | "jack";

const STAND: Pose = {
  head: [80, 9],
  sh: [80, 18],
  hip: [80, 42],
  elbow: [82, 30],
  hand: [82, 44],
  kA: [80, 61],
  fA: [80, 80],
  kB: [84, 61],
  fB: [86, 80],
};

const with_ = (patch: Partial<Pose>): Pose => ({ ...STAND, ...patch });

/** Каждое движение — две позы; фигурка плавно переходит из одной в другую и обратно. */
const MOVES: Record<Kind, [Pose, Pose]> = {
  squat: [
    with_({ elbow: [88, 24], hand: [100, 24] }),
    {
      head: [90, 22],
      sh: [86, 32],
      hip: [68, 58],
      elbow: [98, 38],
      hand: [108, 36],
      kA: [96, 56],
      fA: [84, 80],
      kB: [100, 58],
      fB: [90, 80],
    },
  ],
  lunge: [
    STAND,
    {
      head: [80, 22],
      sh: [80, 32],
      hip: [78, 56],
      elbow: [82, 44],
      hand: [82, 58],
      kA: [104, 58],
      fA: [104, 80],
      kB: [60, 76],
      fB: [42, 78],
    },
  ],
  pushup: [
    {
      head: [112, 50],
      sh: [100, 54],
      hip: [64, 66],
      elbow: [100, 67],
      hand: [100, 80],
      kA: [46, 72],
      fA: [28, 78],
      kB: [46, 72],
      fB: [30, 78],
    },
    {
      head: [112, 70],
      sh: [100, 72],
      hip: [64, 74],
      elbow: [88, 78],
      hand: [100, 80],
      kA: [46, 76],
      fA: [28, 78],
      kB: [46, 76],
      fB: [30, 78],
    },
  ],
  pullup: [
    {
      head: [80, 21],
      sh: [80, 30],
      hip: [80, 54],
      elbow: [80, 18],
      hand: [80, 4],
      kA: [76, 67],
      fA: [74, 78],
      kB: [82, 67],
      fB: [82, 78],
    },
    {
      head: [84, 2],
      sh: [80, 12],
      hip: [80, 36],
      elbow: [92, 14],
      hand: [80, 4],
      kA: [76, 49],
      fA: [74, 60],
      kB: [82, 49],
      fB: [82, 60],
    },
  ],
  bench: [
    {
      head: [116, 60],
      sh: [100, 62],
      hip: [68, 64],
      elbow: [110, 56],
      hand: [102, 46],
      kA: [52, 48],
      fA: [44, 76],
      kB: [56, 48],
      fB: [48, 76],
    },
    {
      head: [116, 60],
      sh: [100, 62],
      hip: [68, 64],
      elbow: [101, 47],
      hand: [101, 33],
      kA: [52, 48],
      fA: [44, 76],
      kB: [56, 48],
      fB: [48, 76],
    },
  ],
  row: [
    {
      head: [104, 26],
      sh: [96, 32],
      hip: [66, 48],
      elbow: [96, 48],
      hand: [96, 62],
      kA: [74, 64],
      fA: [70, 80],
      kB: [78, 64],
      fB: [74, 80],
    },
    {
      head: [104, 26],
      sh: [96, 32],
      hip: [66, 48],
      elbow: [78, 42],
      hand: [90, 50],
      kA: [74, 64],
      fA: [70, 80],
      kB: [78, 64],
      fB: [74, 80],
    },
  ],
  press: [with_({ elbow: [88, 28], hand: [88, 14] }), with_({ elbow: [84, 8], hand: [84, -4] })],
  curl: [with_({ elbow: [82, 30], hand: [82, 46] }), with_({ elbow: [84, 30], hand: [94, 18] })],
  calf: [
    STAND,
    {
      head: [80, 3],
      sh: [80, 12],
      hip: [80, 36],
      elbow: [82, 24],
      hand: [82, 38],
      kA: [80, 56],
      fA: [80, 74],
      kB: [84, 56],
      fB: [86, 74],
    },
  ],
  crunch: [
    {
      head: [40, 70],
      sh: [48, 72],
      hip: [78, 72],
      elbow: [42, 60],
      hand: [38, 68],
      kA: [96, 54],
      fA: [104, 74],
      kB: [98, 52],
      fB: [108, 74],
    },
    {
      head: [52, 50],
      sh: [58, 56],
      hip: [78, 72],
      elbow: [52, 46],
      hand: [46, 54],
      kA: [96, 54],
      fA: [104, 74],
      kB: [98, 52],
      fB: [108, 74],
    },
  ],
  jack: [
    STAND,
    with_({
      elbow: [86, 8],
      hand: [84, -4],
      kA: [72, 61],
      fA: [64, 80],
      kB: [90, 61],
      fB: [98, 80],
    }),
  ],
  superman: [
    {
      head: [112, 72],
      sh: [100, 74],
      hip: [68, 74],
      elbow: [110, 74],
      hand: [124, 74],
      kA: [48, 74],
      fA: [30, 74],
      kB: [50, 75],
      fB: [32, 75],
    },
    {
      head: [114, 62],
      sh: [100, 68],
      hip: [68, 74],
      elbow: [112, 66],
      hand: [126, 58],
      kA: [48, 70],
      fA: [30, 64],
      kB: [50, 71],
      fB: [32, 66],
    },
  ],
};

// Порядок важен: первое совпавшее правило выигрывает.
const RULES: [RegExp, Kind][] = [
  [/superman/, "superman"],
  [/jack|burpee/, "jack"],
  [/pull-up|pulldown/, "pullup"],
  [/push-up|dip|plank/, "pushup"],
  [/overhead|shoulder-press|lateral-raise|pushdown/, "press"],
  [/leg-press|leg-extension/, "squat"],
  [/bench|fly|skull|press$/, "bench"],
  [/curl/, "curl"],
  [/calf/, "calf"],
  [/crunch|raise|twist|bridge|thrust/, "crunch"],
  [/row|face-pull|deadlift|swing/, "row"],
  [/lunge|split|kick|walk|climber|treadmill|knees/, "lunge"],
  [/squat|leg-|jump/, "squat"],
];

const BY_MUSCLE: Record<string, Kind> = {
  chest: "bench",
  back: "row",
  legs: "squat",
  shoulders: "press",
  arms: "curl",
  core: "crunch",
};

export function movementFor(slug: string, muscle?: string | null): Kind {
  for (const [re, kind] of RULES) if (re.test(slug)) return kind;
  return (muscle && BY_MUSCLE[muscle]) || "squat";
}

const pt = (p: P) => `${p[0]} ${p[1]}`;
const body = (p: Pose) => `M${pt(p.sh)} L${pt(p.hip)}`;
const arm = (p: Pose) => `M${pt(p.sh)} L${pt(p.elbow)} L${pt(p.hand)}`;
const legA = (p: Pose) => `M${pt(p.hip)} L${pt(p.kA)} L${pt(p.fA)}`;
const legB = (p: Pose) => `M${pt(p.hip)} L${pt(p.kB)} L${pt(p.fB)}`;

const DUR = "1.8s";
const ease = {
  calcMode: "spline",
  keyTimes: "0;0.5;1",
  keySplines: "0.45 0 0.55 1;0.45 0 0.55 1",
  dur: DUR,
  repeatCount: "indefinite",
} as const;

function Anim({ attr, from, to }: { attr: string; from: string; to: string }) {
  return <animate attributeName={attr} values={`${from};${to};${from}`} {...ease} />;
}

/** Анимированная схема движения: фигурка в профиль, без внешних файлов. */
export function ExerciseAnimation({
  slug,
  muscle,
  label,
}: {
  slug: string;
  muscle?: string | null;
  label: string;
}) {
  const kind = movementFor(slug, muscle);
  const [a, b] = MOVES[kind];
  const ref = useRef<SVGSVGElement>(null);
  const titleId = useId();

  // При «Анимации выключены» или «уменьшить движение» — статичная конечная поза.
  useEffect(() => {
    const svg = ref.current;
    if (!svg || effectsAllowed()) return;
    svg.pauseAnimations();
    svg.setCurrentTime(1);
  }, []);

  const limb = {
    fill: "none",
    strokeWidth: 5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  return (
    <svg
      ref={ref}
      viewBox="0 -6 160 90"
      role="img"
      aria-labelledby={titleId}
      className="size-full text-fg"
    >
      <title id={titleId}>{label}</title>
      <rect x="0" y="-6" width="160" height="90" className="fill-accent-soft" />
      <line x1="10" y1="81" x2="150" y2="81" className="stroke-line" strokeWidth="2" />
      {kind === "pullup" && (
        <line
          x1="50"
          y1="4"
          x2="110"
          y2="4"
          className="stroke-muted"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {kind === "bench" && (
        <rect x="36" y="66" width="92" height="6" rx="2" className="fill-muted" opacity="0.5" />
      )}
      <path d={legB(a)} {...limb} stroke="currentColor" opacity="0.45">
        <Anim attr="d" from={legB(a)} to={legB(b)} />
      </path>
      <path d={legA(a)} {...limb} stroke="currentColor">
        <Anim attr="d" from={legA(a)} to={legA(b)} />
      </path>
      <path d={body(a)} {...limb} strokeWidth={6} stroke="currentColor">
        <Anim attr="d" from={body(a)} to={body(b)} />
      </path>
      <path d={arm(a)} {...limb} className="stroke-accent">
        <Anim attr="d" from={arm(a)} to={arm(b)} />
      </path>
      <circle r="6.5" cx={a.head[0]} cy={a.head[1]} className="fill-accent">
        <Anim attr="cx" from={String(a.head[0])} to={String(b.head[0])} />
        <Anim attr="cy" from={String(a.head[1])} to={String(b.head[1])} />
      </circle>
    </svg>
  );
}

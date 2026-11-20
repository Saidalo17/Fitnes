"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { useT } from "@/i18n/client";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
};

/** Степпер + ползунок с крупной цифрой по центру (рост/вес). */
export function Slider({ label, value, onChange, min, max, step = 1, unit }: Props) {
  const id = useId();
  const t = useT();
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const round = (v: number) => Number(v.toFixed(2));
  return (
    <div className="flex flex-col items-center gap-3">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label={`${label}: ${t("common.less")}`}
          onClick={() => onChange(round(clamp(value - step)))}
          className="grid size-11 place-items-center rounded-sm border border-line bg-surface active:scale-95"
        >
          <Minus size={18} />
        </button>
        <div className="num text-5xl">
          {value}
          <span className="ml-1 text-lg font-medium text-muted">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`${label}: ${t("common.more")}`}
          onClick={() => onChange(round(clamp(value + step)))}
          className="grid size-11 place-items-center rounded-sm border border-line bg-surface active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full max-w-xs cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
}

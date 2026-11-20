"use client";

import { cn } from "@/lib/cn";

type Props = {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, value, onChange }: Props) {
  return (
    <div role="tablist" className="inline-flex rounded-sm bg-surface-2 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "h-9 rounded-sm px-4 text-sm font-semibold transition",
            value === t.id ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

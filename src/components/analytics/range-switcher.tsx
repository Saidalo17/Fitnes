"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useT } from "@/i18n/client";
import { RANGES, type Range } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function RangeSwitcher({ value }: { value: Range }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const select = (r: Range) => {
    const next = new URLSearchParams(sp.toString());
    next.set("range", r);
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  return (
    <div
      role="tablist"
      aria-label={t("analytics.rangeLabel")}
      className={cn("inline-flex rounded-sm bg-surface-2 p-1", pending && "opacity-70")}
    >
      {RANGES.map((r) => (
        <button
          key={r}
          role="tab"
          type="button"
          aria-selected={value === r}
          onClick={() => select(r)}
          className={cn(
            "h-9 rounded-sm px-3 text-sm font-semibold transition sm:px-4",
            value === r ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          {t(`analytics.range.${r}`)}
        </button>
      ))}
    </div>
  );
}

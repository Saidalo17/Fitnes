"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/actions/locale";
import { useI18n } from "@/i18n/client";
import { LOCALES } from "@/i18n/config";
import { cn } from "@/lib/cn";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex h-11 rounded-sm border border-line bg-surface p-1",
        pending && "opacity-60",
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={cn(
            "rounded-sm px-2.5 text-xs font-bold uppercase transition",
            l === locale ? "bg-accent text-on-accent" : "text-muted hover:text-fg",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

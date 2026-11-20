"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useT } from "@/i18n/client";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  return (
    <button
      type="button"
      aria-label={t("common.toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-11 place-items-center rounded-sm border border-line bg-surface transition active:scale-95"
    >
      <Sun size={20} className="hidden dark:block" />
      <Moon size={20} className="dark:hidden" />
    </button>
  );
}

"use client";

import { Bot, ChartLine, Dumbbell, Home, Trophy, User, Users, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

const items = [
  { href: "/", key: "nav.home", icon: Home, mobile: true },
  { href: "/workouts", key: "nav.workouts", icon: Dumbbell, mobile: true },
  { href: "/nutrition", key: "nav.nutrition", icon: Utensils, mobile: true },
  { href: "/coach", key: "nav.coach", icon: Bot, mobile: true },
  { href: "/friends", key: "nav.friends", icon: Users, mobile: true },
  { href: "/analytics", key: "nav.analytics", icon: ChartLine, mobile: false },
  { href: "/achievements", key: "nav.achievements", icon: Trophy, mobile: false },
  { href: "/profile", key: "nav.profile", icon: User, mobile: true },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

function Badge({ n }: { n: number }) {
  const t = useT();
  return (
    <span className="num absolute -right-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-on-accent">
      {n}
      <span className="sr-only"> {t("social.newItems")}</span>
    </span>
  );
}

/** Нижняя панель (< 1024px). */
export function BottomNav({ friendsBadge = 0 }: { friendsBadge?: number }) {
  const isActive = useActive();
  const t = useT();
  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-xl items-stretch">
        {items
          .filter((i) => i.mobile)
          .map(({ href, key, icon: Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition",
                  isActive(href) ? "text-accent-text" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={1.75} />
                  {href === "/friends" && friendsBadge > 0 && <Badge n={friendsBadge} />}
                </span>
                {t(key)}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}

/** Боковая панель (≥ 1024px). */
export function SideNav({ friendsBadge = 0 }: { friendsBadge?: number }) {
  const isActive = useActive();
  const t = useT();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface p-4 lg:flex">
      <div className="mb-8 px-2 font-display text-3xl font-extrabold">
        Fit<span className="text-accent-text">nes</span>
      </div>
      <nav aria-label={t("nav.main")} className="flex-1">
        <ul className="flex flex-col gap-1">
          {items.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-semibold transition",
                  isActive(href)
                    ? "bg-accent-soft text-accent-text"
                    : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon size={20} strokeWidth={1.75} />
                {t(key)}
                {href === "/friends" && friendsBadge > 0 && (
                  <span className="num ml-auto rounded-full bg-accent px-1.5 text-xs text-on-accent">
                    {friendsBadge}
                    <span className="sr-only"> {t("social.newItems")}</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-col gap-2">
        <div className="self-start">
          <LanguageSwitcher />
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <LogoutButton withLabel />
        </div>
      </div>
    </aside>
  );
}

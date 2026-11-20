import Link from "next/link";
import { Users } from "lucide-react";
import { BottomNav, SideNav } from "@/components/nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FxSync } from "@/components/fx-sync";
import { TzSync } from "@/components/tz-sync";
import { getT } from "@/i18n/server";
import { getReduceEffects, getTzOffset } from "@/lib/prefs";
import { getSessionUserId, requireOnboardedUser } from "@/lib/session";
import { getSocialBadge } from "@/lib/social-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessionId = await getSessionUserId();
  // профиль и значок «Друзья» грузим параллельно
  const [{ profile }, social, tz, fxOff] = await Promise.all([
    requireOnboardedUser(),
    sessionId ? getSocialBadge(sessionId) : Promise.resolve({ requests: 0, unread: 0 }),
    getTzOffset(),
    getReduceEffects(),
  ]);
  const badges = { "/friends": social.requests, "/chat": social.unread };
  const { t } = await getT();
  return (
    <>
      <TzSync current={tz} />
      <FxSync wantOff={profile.reduceEffects} currentOff={fxOff} />
      <SideNav badges={badges} />
      <BottomNav badges={badges} />
      <div className="lg:pl-60">
        <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:hidden">
          <span className="font-display text-2xl font-extrabold">
            Fit<span className="text-accent-text">nes</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/friends"
              aria-label={t("nav.friends")}
              className="relative grid size-11 place-items-center rounded-sm border border-line bg-surface text-fg transition active:scale-95"
            >
              <Users size={20} strokeWidth={1.75} />
              {social.requests > 0 && (
                <span className="num absolute -right-1 -top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-on-accent">
                  {social.requests}
                </span>
              )}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="max-[359px]:hidden">
              <LogoutButton />
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>
    </>
  );
}

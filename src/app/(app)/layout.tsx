import { BottomNav, SideNav } from "@/components/nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FxSync } from "@/components/fx-sync";
import { TzSync } from "@/components/tz-sync";
import { getReduceEffects, getTzOffset } from "@/lib/prefs";
import { requireOnboardedUser } from "@/lib/session";
import { getSocialBadge } from "@/lib/social-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireOnboardedUser();
  const friendsBadge = await getSocialBadge(userId);
  const tz = await getTzOffset();
  const fxOff = await getReduceEffects();
  return (
    <>
      <TzSync current={tz} />
      <FxSync wantOff={profile.reduceEffects} currentOff={fxOff} />
      <SideNav friendsBadge={friendsBadge} />
      <BottomNav friendsBadge={friendsBadge} />
      <div className="lg:pl-60">
        <header className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <span className="font-display text-2xl font-extrabold">
            Fit<span className="text-accent-text">nes</span>
          </span>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>
    </>
  );
}

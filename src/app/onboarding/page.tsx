import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { OnboardingWizard } from "@/components/profile/onboarding-wizard";
import { ThemeToggle } from "@/components/theme-toggle";
import { getT } from "@/i18n/server";
import { getProfile, requireUserId } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.onboarding") };
}

export default async function OnboardingPage() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  if (profile?.goal) redirect("/"); // анкета уже заполнена
  return (
    <main className="min-h-dvh">
      <div className="mx-auto flex max-w-md justify-end gap-2 px-4 pt-4">
        <LanguageSwitcher />
        <ThemeToggle />
        <LogoutButton />
      </div>
      <OnboardingWizard />
    </main>
  );
}

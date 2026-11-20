import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { ProfileView } from "@/components/profile/profile-view";
import type { Draft } from "@/components/profile/fields";
import { getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("profile.title")} — Fitnes` };
}

export default async function ProfilePage() {
  const { userId, profile } = await requireOnboardedUser();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  const initial: Draft = {
    sex: profile.sex ?? "",
    birthYear: profile.birthYear ?? 1995,
    heightCm: profile.heightCm ?? 175,
    weightKg: profile.weightKg ?? 70,
    goal: profile.goal ?? "",
    focusMuscle: profile.focusMuscle ?? "",
    place: profile.place ?? "",
    level: profile.level ?? "",
    weeklyTarget: profile.weeklyTarget ?? 3,
  };

  return (
    <ProfileView
      initial={initial}
      name={user?.name ?? ""}
      email={user?.email ?? ""}
      xp={profile.xp}
      reduceEffects={profile.reduceEffects}
    />
  );
}

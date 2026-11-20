import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { ProfileView } from "@/components/profile/profile-view";
import type { Draft } from "@/components/profile/fields";
import { MySocialProfile } from "@/components/social/my-social-profile";
import { PeopleSearch } from "@/components/social/people-search";
import { ProfileHeader } from "@/components/social/profile-header";
import { getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { getSocialBadge } from "@/lib/social-data";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("profile.title")} — Fitnes` };
}

export default async function ProfilePage() {
  const { userId, profile } = await requireOnboardedUser();
  const { t } = await getT();
  const [[user], badge] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    getSocialBadge(userId),
  ]);

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
      reduceEffects={profile.reduceEffects}
      top={
        <>
          <ProfileHeader
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            avatar={profile.avatar}
            status={profile.status}
            bio={profile.bio}
            xp={profile.xp}
            t={t}
          />
          <PeopleSearch showFriendsLink requests={badge.requests} />
        </>
      }
      middle={
        <MySocialProfile
          name={user?.name ?? ""}
          initial={{
            avatar: profile.avatar,
            bio: profile.bio ?? "",
            status: profile.status ?? "",
            discoverable: profile.discoverable,
          }}
        />
      }
    />
  );
}

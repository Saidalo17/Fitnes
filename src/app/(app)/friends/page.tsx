import { FriendsView } from "@/components/social/friends-view";
import { getT } from "@/i18n/server";
import { requireUserId } from "@/lib/session";
import { listBlocked, listFriends, listIncomingRequests } from "@/lib/social-data";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("social.title")} — Fitnes` };
}

export default async function FriendsPage() {
  const me = await requireUserId();
  const [friends, requests, blocked] = await Promise.all([
    listFriends(me),
    listIncomingRequests(me),
    listBlocked(me),
  ]);
  return <FriendsView friends={friends} requests={requests} blocked={blocked} />;
}

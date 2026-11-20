"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { blocks, friendships, messages, profiles, reports, users } from "@/db/schema";
import { getT } from "@/i18n/server";
import { createRateLimiter } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/session";
import {
  BIO_MAX,
  cleanText,
  isValidAvatar,
  MESSAGE_MAX,
  REPORT_MAX,
  STATUS_MAX,
} from "@/lib/social";
import { getFriendship, getRelation, searchPeople, type ChatMessage } from "@/lib/social-data";

export type SocialResult = { ok: boolean; error?: string };

const messageLimit = createRateLimiter(30, 60_000);
const requestLimit = createRateLimiter(20, 60 * 60_000);
const searchLimit = createRateLimiter(30, 60_000);
const reportLimit = createRateLimiter(5, 60 * 60_000);

async function userExists(id: string) {
  if (typeof id !== "string" || id.length > 64) return false;
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  return !!u;
}

function refresh() {
  revalidatePath("/friends", "layout");
  revalidatePath("/", "layout");
}

/** Публичный профиль: описание, статус, фото (null — удалить, undefined — не менять), видимость в поиске. */
export async function saveSocialProfile(input: {
  bio: string;
  status: string;
  avatar?: string | null;
  discoverable: boolean;
}): Promise<SocialResult> {
  const userId = await requireUserId();
  const { t } = await getT();
  const values: Partial<typeof profiles.$inferInsert> = {
    bio: cleanText(input.bio, BIO_MAX, true) || null,
    status: cleanText(input.status, STATUS_MAX) || null,
    discoverable: !!input.discoverable,
  };
  if (input.avatar === null) values.avatar = null;
  else if (input.avatar !== undefined) {
    if (!isValidAvatar(input.avatar)) return { ok: false, error: t("social.errors.badImage") };
    values.avatar = input.avatar;
  }
  try {
    await db.update(profiles).set(values).where(eq(profiles.userId, userId));
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  refresh();
  return { ok: true };
}

export async function sendFriendRequest(otherId: string): Promise<SocialResult> {
  const me = await requireUserId();
  const { t } = await getT();
  if (!(await userExists(otherId))) return { ok: false, error: t("social.errors.notFound") };
  if (me === otherId) return { ok: false, error: t("social.errors.self") };
  if (!requestLimit.take(me)) return { ok: false, error: t("social.errors.rateLimit") };

  const relation = await getRelation(me, otherId);
  if (relation === "blocked" || relation === "blockedBy")
    return { ok: false, error: t("social.errors.blocked") };
  if (relation === "friends" || relation === "outgoing") return { ok: true };
  try {
    if (relation === "incoming") {
      // встречный запрос — сразу дружба
      await db
        .update(friendships)
        .set({ status: "accepted" })
        .where(and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, me)));
    } else {
      await db
        .insert(friendships)
        .values({ requesterId: me, addresseeId: otherId })
        .onConflictDoNothing();
    }
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  refresh();
  return { ok: true };
}

export async function respondFriendRequest(
  otherId: string,
  accept: boolean,
): Promise<SocialResult> {
  const me = await requireUserId();
  const { t } = await getT();
  const f = await getFriendship(me, otherId);
  if (!f || f.status !== "pending" || f.addresseeId !== me)
    return { ok: false, error: t("social.errors.notFound") };
  try {
    if (accept)
      await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, f.id));
    else await db.delete(friendships).where(eq(friendships.id, f.id));
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  refresh();
  return { ok: true };
}

/** Удалить из друзей или отменить свой исходящий запрос. */
export async function removeFriend(otherId: string): Promise<SocialResult> {
  const me = await requireUserId();
  const { t } = await getT();
  try {
    await db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, me), eq(friendships.addresseeId, otherId)),
          and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, me)),
        ),
      );
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  refresh();
  return { ok: true };
}

export async function blockUser(otherId: string): Promise<SocialResult> {
  const me = await requireUserId();
  const { t } = await getT();
  if (me === otherId) return { ok: false, error: t("social.errors.self") };
  if (!(await userExists(otherId))) return { ok: false, error: t("social.errors.notFound") };
  try {
    await db.insert(blocks).values({ blockerId: me, blockedId: otherId }).onConflictDoNothing();
    await db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, me), eq(friendships.addresseeId, otherId)),
          and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, me)),
        ),
      );
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  refresh();
  return { ok: true };
}

export async function unblockUser(otherId: string): Promise<SocialResult> {
  const me = await requireUserId();
  const { t } = await getT();
  try {
    await db.delete(blocks).where(and(eq(blocks.blockerId, me), eq(blocks.blockedId, otherId)));
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  refresh();
  return { ok: true };
}

export async function reportUser(otherId: string, reason: string): Promise<SocialResult> {
  const me = await requireUserId();
  const { t } = await getT();
  if (me === otherId) return { ok: false, error: t("social.errors.self") };
  if (!(await userExists(otherId))) return { ok: false, error: t("social.errors.notFound") };
  const text = cleanText(reason, REPORT_MAX, true);
  if (!text) return { ok: false, error: t("social.errors.empty") };
  if (!reportLimit.take(me)) return { ok: false, error: t("social.errors.rateLimit") };
  try {
    await db.insert(reports).values({ reporterId: me, reportedId: otherId, reason: text });
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
  return { ok: true };
}

export async function sendMessage(
  otherId: string,
  body: string,
): Promise<SocialResult & { message?: ChatMessage }> {
  const me = await requireUserId();
  const { t } = await getT();
  const text = cleanText(body, MESSAGE_MAX + 1, true);
  if (!text) return { ok: false, error: t("social.errors.empty") };
  if (text.length > MESSAGE_MAX)
    return { ok: false, error: t("social.errors.tooLong", { n: MESSAGE_MAX }) };
  const relation = await getRelation(me, otherId);
  if (relation === "blocked" || relation === "blockedBy")
    return { ok: false, error: t("social.errors.blocked") };
  if (relation !== "friends") return { ok: false, error: t("social.errors.notFriends") };
  if (!messageLimit.take(me)) return { ok: false, error: t("social.errors.rateLimit") };
  try {
    const [row] = await db
      .insert(messages)
      .values({ senderId: me, recipientId: otherId, body: text })
      .returning();
    return {
      ok: true,
      message: { id: row.id, mine: true, body: row.body, at: row.createdAt.getTime() },
    };
  } catch {
    return { ok: false, error: t("errors.generic") };
  }
}

export async function searchPeopleAction(query: string) {
  const me = await requireUserId();
  if (typeof query !== "string" || query.length > 60) return [];
  if (!searchLimit.take(me)) return [];
  return searchPeople(me, query);
}

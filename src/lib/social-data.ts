import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { blocks, friendships, messages, profiles, users } from "@/db/schema";
import { nameMatches, relationOf, SEARCH_MIN, type Relation } from "./social";

export type PersonCard = {
  id: string;
  name: string;
  avatar: string | null;
  status: string | null;
  relation: Relation;
};

export async function getFriendship(a: string, b: string) {
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getRelation(me: string, other: string): Promise<Relation> {
  if (me === other) return "self";
  const [mineBlock] = await db
    .select({ b: blocks.blockedId })
    .from(blocks)
    .where(and(eq(blocks.blockerId, me), eq(blocks.blockedId, other)))
    .limit(1);
  const [theirBlock] = await db
    .select({ b: blocks.blockedId })
    .from(blocks)
    .where(and(eq(blocks.blockerId, other), eq(blocks.blockedId, me)))
    .limit(1);
  const friendship = await getFriendship(me, other);
  return relationOf({
    me,
    blockedByMe: !!mineBlock,
    blockedMe: !!theirBlock,
    friendship: friendship
      ? { requesterId: friendship.requesterId, status: friendship.status }
      : null,
  });
}

export async function areFriends(a: string, b: string) {
  return (await getRelation(a, b)) === "friends";
}

/** Id всех, с кем есть блокировка в любую сторону. */
async function blockedIds(me: string) {
  const rows = await db
    .select({ a: blocks.blockerId, b: blocks.blockedId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, me), eq(blocks.blockedId, me)));
  return new Set(rows.map((r) => (r.a === me ? r.b : r.a)));
}

/** Поиск по имени: чужие видят только имя и фото. */
export async function searchPeople(me: string, query: string): Promise<PersonCard[]> {
  const q = query.trim();
  if (Array.from(q).length < SEARCH_MIN) return [];
  const rows = await db
    .select({ id: users.id, name: users.name, avatar: profiles.avatar })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(profiles.discoverable, true), sql`${users.id} <> ${me}`))
    .limit(1000);
  const hidden = await blockedIds(me);
  const found = rows.filter((r) => !hidden.has(r.id) && nameMatches(r.name, q)).slice(0, 10);
  const out: PersonCard[] = [];
  for (const r of found) {
    out.push({
      id: r.id,
      name: r.name ?? "—",
      avatar: r.avatar,
      status: null,
      relation: await getRelation(me, r.id),
    });
  }
  return out;
}

export async function listFriends(me: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)),
      ),
    );
  const hidden = await blockedIds(me);
  const ids = rows
    .map((r) => (r.requesterId === me ? r.addresseeId : r.requesterId))
    .filter((id) => !hidden.has(id));
  if (!ids.length) return [];
  const people = await db
    .select({ id: users.id, name: users.name, avatar: profiles.avatar, status: profiles.status })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(inArray(users.id, ids));
  const unread = await db
    .select({ id: messages.senderId, n: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(eq(messages.recipientId, me), isNull(messages.readAt), inArray(messages.senderId, ids)),
    )
    .groupBy(messages.senderId);
  const unreadBy = new Map(unread.map((u) => [u.id, Number(u.n)]));
  return people
    .map((p) => ({
      id: p.id,
      name: p.name ?? "—",
      avatar: p.avatar ?? null,
      status: p.status ?? null,
      unread: unreadBy.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.unread - a.unread || a.name.localeCompare(b.name));
}

export async function listIncomingRequests(me: string) {
  const hidden = await blockedIds(me);
  const rows = await db
    .select({ id: users.id, name: users.name, avatar: profiles.avatar })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.requesterId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(friendships.addresseeId, me), eq(friendships.status, "pending")))
    .orderBy(desc(friendships.id));
  return rows
    .filter((r) => !hidden.has(r.id))
    .map((r) => ({ id: r.id, name: r.name ?? "—", avatar: r.avatar ?? null }));
}

export async function listBlocked(me: string) {
  return db
    .select({ id: users.id, name: users.name })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedId))
    .where(eq(blocks.blockerId, me));
}

export type PublicProfile = {
  id: string;
  name: string;
  avatar: string | null;
  relation: Relation;
  /** Только для друзей и для себя. */
  bio: string | null;
  status: string | null;
  xp: number | null;
};

export async function getPublicProfile(me: string, otherId: string): Promise<PublicProfile | null> {
  const relation = await getRelation(me, otherId);
  if (relation === "blockedBy") return null;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: profiles.avatar,
      bio: profiles.bio,
      status: profiles.status,
      xp: profiles.xp,
      discoverable: profiles.discoverable,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, otherId))
    .limit(1);
  if (!row) return null;
  // Незнакомого человека, скрытого из поиска, открыть по ссылке нельзя.
  if (relation === "none" && row.discoverable === false) return null;
  const full = relation === "friends" || relation === "self";
  return {
    id: row.id,
    name: row.name ?? "—",
    avatar: row.avatar ?? null,
    relation,
    bio: full ? (row.bio ?? null) : null,
    status: full ? (row.status ?? null) : null,
    xp: full ? (row.xp ?? 0) : null,
  };
}

export type ChatMessage = { id: number; mine: boolean; body: string; at: number };

/** Сообщения диалога после `afterId`; входящие помечаются прочитанными. */
export async function getConversation(
  me: string,
  other: string,
  afterId = 0,
): Promise<ChatMessage[]> {
  const pair = or(
    and(eq(messages.senderId, me), eq(messages.recipientId, other)),
    and(eq(messages.senderId, other), eq(messages.recipientId, me)),
  );
  const rows =
    afterId > 0
      ? await db
          .select()
          .from(messages)
          .where(and(pair, gt(messages.id, afterId)))
          .orderBy(asc(messages.id))
          .limit(100)
      : (
          await db.select().from(messages).where(pair).orderBy(desc(messages.id)).limit(50)
        ).reverse();
  if (rows.some((r) => r.recipientId === me && !r.readAt)) {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(eq(messages.senderId, other), eq(messages.recipientId, me), isNull(messages.readAt)),
      );
  }
  return rows.map((r) => ({
    id: r.id,
    mine: r.senderId === me,
    body: r.body,
    at: r.createdAt.getTime(),
  }));
}

/** Для значка в меню: непрочитанные сообщения + входящие запросы. */
export async function getSocialBadge(me: string) {
  const [{ n: unread }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.recipientId, me), isNull(messages.readAt)));
  const requests = await listIncomingRequests(me);
  return Number(unread) + requests.length;
}

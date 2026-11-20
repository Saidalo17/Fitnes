import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db/client";
import { profiles, users } from "@/db/schema";
import { auth } from "./auth";

/** Id из cookie сессии (без обращения к БД). Кешируется на время одного запроса. */
export const getSessionUserId = cache(async () => (await auth())?.user?.id ?? null);

/** Пользователь + профиль одним запросом; на один запрос страницы — один вызов. */
const loadViewer = cache(async (id: string) => {
  const [row] = await db
    .select({ id: users.id, name: users.name, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
});

/** Только проверка существования — без кеша профиля, чтобы Server Actions не оставляли устаревших данных. */
const userExists = cache(async (id: string) => {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  return !!row;
});

/** Требует вход (и существование пользователя в БД); возвращает id. */
export async function requireUserId() {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  if (!(await userExists(id))) redirect("/logout"); // сессия удалённого пользователя
  return id;
}

/** Требует вход и заполненный профиль (иначе — на онбординг). */
export async function requireOnboardedUser() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const viewer = await loadViewer(userId);
  if (!viewer) redirect("/logout");
  if (!viewer.profile?.goal) redirect("/onboarding");
  return { userId, profile: viewer.profile, name: viewer.name };
}

/** Профиль пользователя (может быть пустым до онбординга). */
export async function getProfile(userId: string) {
  return (await loadViewer(userId))?.profile ?? null;
}

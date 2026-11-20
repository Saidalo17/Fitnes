import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { profiles, users } from "@/db/schema";
import { auth } from "./auth";

/** Требует вход (и существование пользователя в БД); возвращает id. */
export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (!user) redirect("/logout"); // сессия удалённого пользователя
  return id;
}

/** Требует вход и заполненный профиль (иначе — на онбординг). */
export async function requireOnboardedUser() {
  const userId = await requireUserId();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profile?.goal) redirect("/onboarding");
  return { userId, profile };
}

/** Профиль пользователя (может быть пустым до онбординга). */
export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile ?? null;
}

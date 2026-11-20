"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { chatMessages } from "@/db/schema";
import { requireUserId } from "@/lib/session";

/** Удаляет историю чата текущего пользователя. */
export async function clearChat(): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  revalidatePath("/coach");
  return { ok: true };
}

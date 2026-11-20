"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { profiles, users } from "@/db/schema";
import { signIn, signOut } from "@/lib/auth";
import { isLimited, registerFail, resetFails } from "@/lib/rate-limit";
import { getT } from "@/i18n/server";
import { makeLoginSchema, makeRegisterSchema } from "@/lib/validators";

export type FormState = {
  error?: string;
  values?: { name?: string; email?: string };
  fieldErrors?: Record<string, string[] | undefined>;
};

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}

export async function registerUser(_: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getT();
  const raw = Object.fromEntries(formData);
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? "") };
  const parsed = makeRegisterSchema(t).safeParse(raw);
  if (!parsed.success) return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, email, password } = parsed.data;

  const key = `register:${await clientIp()}`;
  if (isLimited(key)) return { values, error: t("errors.tooMany") };
  registerFail(key); // каждая попытка регистрации считается

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { values, fieldErrors: { email: [t("errors.emailTaken")] } };

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  try {
    await db.insert(users).values({ id, email, name, passwordHash });
    await db.insert(profiles).values({ userId: id });
  } catch {
    return { values, error: t("errors.createFailed") };
  }

  await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  return {};
}

export async function loginUser(_: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getT();
  const raw = Object.fromEntries(formData);
  const values = { email: String(raw.email ?? "") };
  const parsed = makeLoginSchema(t).safeParse(raw);
  if (!parsed.success) return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  const { email, password } = parsed.data;

  const key = `login:${await clientIp()}:${email}`;
  if (isLimited(key)) return { values, error: t("errors.tooMany") };

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) {
      registerFail(key);
      return { values, error: t("errors.badCredentials") };
    }
    throw e; // NEXT_REDIRECT при успехе
  }
  resetFails(key);
  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

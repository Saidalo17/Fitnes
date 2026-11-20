import Anthropic from "@anthropic-ai/sdk";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatMessages, profiles } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { createT, getMessages } from "@/i18n/translate";
import {
  buildSystemPrompt,
  COACH_HISTORY_LIMIT,
  COACH_JSON_SCHEMA,
  COACH_MAX_CHARS,
  COACH_MODEL,
  interpretCoachOutput,
} from "./coach";
import { createRateLimiter } from "./rate-limit";
import { targetsFromProfile } from "./nutrition-data";
import { getRecommended } from "./workouts";
import { localized } from "@/i18n/content";

// 20 сообщений за 10 минут на пользователя — защита от злоупотреблений и расходов.
const limiter = createRateLimiter(20, 10 * 60_000);

export type CoachResult =
  | { status: "ok"; reply: string; onTopic: boolean }
  | { status: "not_configured" | "rate_limited" | "too_long" | "error" };

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

/** Собирает историю для модели: сообщения не по теме (и вопрос к ним) в контекст не попадают. */
async function loadHistory(userId: string) {
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.id))
    .limit(COACH_HISTORY_LIMIT * 2);
  const chrono = rows.reverse();
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const r of chrono) {
    if (r.role === "assistant" && !r.onTopic) {
      if (out.at(-1)?.role === "user") out.pop();
      continue;
    }
    out.push({ role: r.role, content: r.content });
  }
  // первое сообщение должно быть от пользователя
  while (out.length && out[0].role !== "user") out.shift();
  return out.slice(-COACH_HISTORY_LIMIT);
}

export async function askCoach(opts: {
  userId: string;
  message: string;
  locale: Locale;
}): Promise<CoachResult> {
  const { userId, locale } = opts;
  const message = opts.message.trim();
  if (!message || message.length > COACH_MAX_CHARS) return { status: "too_long" };
  if (!process.env.ANTHROPIC_API_KEY) return { status: "not_configured" };
  if (!limiter.take(userId)) return { status: "rate_limited" };

  const t = createT(getMessages(locale));
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!profile) return { status: "error" };

  const { goal, targets } = targetsFromProfile(profile);
  const recommended =
    profile.goal && profile.place && profile.level
      ? await getRecommended(
          userId,
          {
            goal: profile.goal,
            focusMuscle: profile.focusMuscle,
            place: profile.place,
            level: profile.level,
          },
          5,
        )
      : [];

  const system = buildSystemPrompt(locale === "ru" ? "Russian" : "English", {
    goal,
    level: profile.level,
    place: profile.place,
    sex: profile.sex,
    age: profile.birthYear ? new Date().getFullYear() - profile.birthYear : null,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    weeklyTarget: profile.weeklyTarget,
    focusMuscle: profile.focusMuscle,
    kcal: targets.kcal,
    proteinG: targets.macros.protein,
    waterMl: targets.waterMl,
    minKcal: profile.sex === "male" ? 1500 : 1200,
    recommended: recommended.map((w) => localized(locale, w.title, w.titleEn)),
  });

  const history = await loadHistory(userId);

  try {
    const response = await getClient().beta.messages.create({
      model: COACH_MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: COACH_JSON_SCHEMA },
      },
      messages: [...history, { role: "user", content: message }],
    });

    if (response.stop_reason === "refusal") return { status: "error" };

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const decision = interpretCoachOutput(text);
    if (!decision) return { status: "error" };

    // Не по теме: пользователь видит только фиксированный отказ, текст модели не используется.
    const reply = decision.onTopic ? decision.reply : t("coach.offTopic");
    await db.insert(chatMessages).values([
      { userId, role: "user", content: message, onTopic: decision.onTopic },
      { userId, role: "assistant", content: reply, onTopic: decision.onTopic },
    ]);
    return { status: "ok", reply, onTopic: decision.onTopic };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { status: "rate_limited" };
    console.error("coach error", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return { status: "error" };
  }
}

export async function loadChat(userId: string, limit = 40) {
  const rows = await db
    .select({ id: chatMessages.id, role: chatMessages.role, content: chatMessages.content })
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.id))
    .limit(limit);
  return rows.reverse();
}

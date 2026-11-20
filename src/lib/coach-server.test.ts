import { execSync } from "node:child_process";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Мокаем SDK: проверяем нашу логику (фильтр темы, история, лимиты), а не сеть и деньги.
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status = 500;
  }
  class RateLimitError extends APIError {}
  const create = vi.fn();
  class Anthropic {
    beta = { messages: { create } };
    static APIError = APIError;
    static RateLimitError = RateLimitError;
  }
  return { default: Anthropic, __create: create };
});

const reply = (obj: unknown, stop = "end_turn") => ({
  stop_reason: stop,
  content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj) }],
});

const userId = `coach-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let create: ReturnType<typeof vi.fn>;
let askCoach: typeof import("./coach-server").askCoach;
let db: typeof import("@/db/client").db;
let schema: typeof import("@/db/schema");

beforeAll(async () => {
  execSync("npx drizzle-kit push --force", {
    stdio: "ignore",
    env: { ...process.env, TURSO_DATABASE_URL: "file:test.db", TURSO_AUTH_TOKEN: "" },
  });
  ({ db } = await import("@/db/client"));
  schema = await import("@/db/schema");
  ({ askCoach } = await import("./coach-server"));
  create = ((await import("@anthropic-ai/sdk")) as unknown as { __create: typeof create }).__create;
  await db
    .insert(schema.users)
    .values({ id: userId, email: `${userId}@example.test`, passwordHash: "x" });
  await db.insert(schema.profiles).values({
    userId,
    sex: "male",
    birthYear: 1995,
    heightCm: 180,
    weightKg: 80,
    goal: "lose_weight",
    place: "home",
    level: "beginner",
    weeklyTarget: 3,
  });
});

afterAll(async () => {
  await db.delete(schema.chatMessages).where(eq(schema.chatMessages.userId, userId));
  await db.delete(schema.profiles).where(eq(schema.profiles.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
});

beforeEach(() => {
  create.mockReset();
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
});

describe("askCoach", () => {
  it("без ключа ANTHROPIC_API_KEY — not_configured, API не вызывается", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await askCoach({ userId, message: "как делать приседания?", locale: "ru" })).toEqual({
      status: "not_configured",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("пустое и слишком длинное сообщение отклоняются до вызова API", async () => {
    expect((await askCoach({ userId, message: "   ", locale: "ru" })).status).toBe("too_long");
    expect((await askCoach({ userId, message: "а".repeat(1001), locale: "ru" })).status).toBe(
      "too_long",
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("вопрос по теме: ответ модели доходит до пользователя и сохраняется", async () => {
    create.mockResolvedValueOnce(reply({ on_topic: true, reply: "Колени по линии носков." }));
    const res = await askCoach({ userId, message: "Как делать приседания?", locale: "ru" });
    expect(res).toEqual({ status: "ok", reply: "Колени по линии носков.", onTopic: true });

    const args = create.mock.calls[0][0];
    expect(args.model).toBe("claude-opus-5-5");
    expect(args.system).toContain("SCOPE (strict)");
    expect(args.system).toContain("Reply in Russian");
    expect(args.output_config.format.type).toBe("json_schema");
    expect(args.messages.at(-1)).toEqual({ role: "user", content: "Как делать приседания?" });
    // в запросе нет имени и email
    expect(JSON.stringify(args)).not.toContain("@example.test");

    const rows = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.userId, userId));
    expect(rows.map((r) => [r.role, r.onTopic])).toEqual([
      ["user", true],
      ["assistant", true],
    ]);
  });

  it("вопрос не по теме: текст модели НЕ показывается, вместо него фиксированный отказ", async () => {
    create.mockResolvedValueOnce(
      reply({ on_topic: false, reply: "Конечно! Вот код сортировки на Python..." }),
    );
    const res = await askCoach({ userId, message: "Напиши сортировку на Python", locale: "ru" });
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.onTopic).toBe(false);
    expect(res.reply).toBe("Я помогаю только с тренировками и питанием. Спросите меня о них!");
    expect(res.reply).not.toContain("Python");
  });

  it("отказ на английском для английской локали", async () => {
    create.mockResolvedValueOnce(reply({ on_topic: false, reply: "" }));
    const res = await askCoach({ userId, message: "Who won the election?", locale: "en" });
    expect(res).toMatchObject({ status: "ok", onTopic: false });
    if (res.status === "ok")
      expect(res.reply).toBe("I only help with workouts and nutrition. Ask me about those!");
  });

  it("не по теме вопрос и отказ не попадают в историю следующего запроса", async () => {
    create.mockResolvedValueOnce(reply({ on_topic: true, reply: "Белок после тренировки." }));
    await askCoach({ userId, message: "Что есть после тренировки?", locale: "ru" });
    const sent = create.mock.calls[0][0].messages as { role: string; content: string }[];
    const joined = JSON.stringify(sent);
    expect(joined).not.toContain("сортировку на Python");
    expect(joined).not.toContain("Who won the election");
    expect(joined).toContain("Как делать приседания?"); // тематическая часть сохранилась
  });

  it("ответ в неверном формате или отказ модели — error, ничего не сохраняется", async () => {
    const before = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.userId, userId));
    create.mockResolvedValueOnce(reply("просто текст, не JSON"));
    expect((await askCoach({ userId, message: "Как растянуться?", locale: "ru" })).status).toBe(
      "error",
    );
    create.mockResolvedValueOnce(reply({ on_topic: true, reply: "x" }, "refusal"));
    expect((await askCoach({ userId, message: "Как растянуться?", locale: "ru" })).status).toBe(
      "error",
    );
    create.mockRejectedValueOnce(new Error("network"));
    expect((await askCoach({ userId, message: "Как растянуться?", locale: "ru" })).status).toBe(
      "error",
    );
    const after = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.userId, userId));
    expect(after.length).toBe(before.length);
  });

  it("лимит: не более 20 сообщений за 10 минут", async () => {
    create.mockResolvedValue(reply({ on_topic: true, reply: "ок" }));
    const results: string[] = [];
    for (let i = 0; i < 25; i++) {
      results.push(
        (await askCoach({ userId, message: `вопрос ${i} про тренировку`, locale: "ru" })).status,
      );
    }
    expect(results.filter((s) => s === "rate_limited").length).toBeGreaterThanOrEqual(1);
    expect(results.at(-1)).toBe("rate_limited");
  });
});

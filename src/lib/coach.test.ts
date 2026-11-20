import { describe, expect, it } from "vitest";
import { buildSystemPrompt, interpretCoachOutput } from "./coach";

describe("interpretCoachOutput", () => {
  it("по теме: возвращает ответ", () => {
    expect(interpretCoachOutput('{"on_topic":true,"reply":" Делайте приседания. "}')).toEqual({
      onTopic: true,
      reply: "Делайте приседания.",
    });
  });
  it("не по теме: текст модели отбрасывается", () => {
    expect(
      interpretCoachOutput('{"on_topic":false,"reply":"Вот решение задачи по математике..."}'),
    ).toEqual({ onTopic: false, reply: "" });
  });
  it("on_topic=true, но пустой ответ → как не по теме", () => {
    expect(interpretCoachOutput('{"on_topic":true,"reply":"   "}')).toEqual({
      onTopic: false,
      reply: "",
    });
  });
  it("невалидный JSON или неверная форма → null", () => {
    expect(interpretCoachOutput("просто текст")).toBeNull();
    expect(interpretCoachOutput('{"reply":"x"}')).toBeNull();
    expect(interpretCoachOutput('{"on_topic":"yes","reply":"x"}')).toBeNull();
  });
});

describe("buildSystemPrompt", () => {
  const profile = {
    goal: "lose_weight",
    level: "beginner",
    place: "home",
    sex: "male",
    age: 30,
    heightCm: 180,
    weightKg: 80,
    weeklyTarget: 3,
    focusMuscle: null,
    kcal: 2100,
    proteinG: 160,
    waterMl: 2800,
    minKcal: 1500,
    recommended: ["Сжигание жира дома · Новичок"],
  };
  it("содержит правила темы, язык и профиль", () => {
    const p = buildSystemPrompt("Russian", profile);
    expect(p).toContain("SCOPE (strict)");
    expect(p).toContain("on_topic");
    expect(p).toContain("Reply in Russian");
    expect(p).toContain("2100 kcal");
    expect(p).toContain("Сжигание жира дома");
    expect(p).toContain("under 18");
  });
  it("не содержит персональных данных (имя, email)", () => {
    const p = buildSystemPrompt("English", profile);
    expect(p).not.toMatch(/@/);
    expect(p).not.toMatch(/\bname\b/i);
  });
});

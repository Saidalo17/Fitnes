import { describe, expect, it } from "vitest";
import {
  AVATAR_MAX_CHARS,
  cleanText,
  initials,
  isValidAvatar,
  nameMatches,
  relationOf,
} from "./social";

describe("cleanText", () => {
  it("убирает управляющие символы и режет по длине", () => {
    expect(cleanText("  при\u0000вет  ", 10)).toBe("привет");
    expect(cleanText("abcdef", 3)).toBe("abc");
  });
  it("многострочный режим сохраняет переносы", () => {
    expect(cleanText("a\nb", 10, true)).toBe("a\nb");
    expect(cleanText("a\nb", 10)).toBe("ab");
  });
  it("не строка → пусто", () => {
    expect(cleanText(42, 5)).toBe("");
  });
});

describe("isValidAvatar", () => {
  it("принимает маленький jpeg data URL", () => {
    expect(isValidAvatar("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
  });
  it("отклоняет svg, чужие схемы и мусор", () => {
    expect(isValidAvatar("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(isValidAvatar("https://example.com/a.png")).toBe(false);
    expect(isValidAvatar("data:image/png;base64,<script>")).toBe(false);
    expect(isValidAvatar(null)).toBe(false);
  });
  it("отклоняет слишком большие", () => {
    expect(isValidAvatar("data:image/png;base64," + "A".repeat(AVATAR_MAX_CHARS))).toBe(false);
  });
});

describe("relationOf", () => {
  const base = { me: "a", blockedByMe: false, blockedMe: false };
  it("определяет отношения", () => {
    expect(relationOf({ ...base, self: true })).toBe("self");
    expect(relationOf({ ...base })).toBe("none");
    expect(relationOf({ ...base, friendship: { requesterId: "a", status: "pending" } })).toBe(
      "outgoing",
    );
    expect(relationOf({ ...base, friendship: { requesterId: "b", status: "pending" } })).toBe(
      "incoming",
    );
    expect(relationOf({ ...base, friendship: { requesterId: "b", status: "accepted" } })).toBe(
      "friends",
    );
  });
  it("блокировка главнее дружбы", () => {
    const f = { requesterId: "b", status: "accepted" as const };
    expect(relationOf({ ...base, blockedByMe: true, friendship: f })).toBe("blocked");
    expect(relationOf({ ...base, blockedMe: true, friendship: f })).toBe("blockedBy");
  });
});

describe("поиск и инициалы", () => {
  it("находит кириллицу без учёта регистра", () => {
    expect(nameMatches("Иван Петров", "иван")).toBe(true);
    expect(nameMatches("Иван Петров", "ПЕТР")).toBe(true);
    expect(nameMatches(null, "а")).toBe(false);
    expect(nameMatches("Анна", "мария")).toBe(false);
  });
  it("инициалы", () => {
    expect(initials("иван петров")).toBe("ИП");
    expect(initials("Anna")).toBe("A");
    expect(initials("")).toBe("?");
  });
});

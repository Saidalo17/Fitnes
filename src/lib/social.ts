// Чистые правила для друзей и чата (без доступа к БД) — удобно тестировать.

export const BIO_MAX = 200;
export const STATUS_MAX = 60;
export const MESSAGE_MAX = 1000;
export const REPORT_MAX = 300;
export const SEARCH_MIN = 2;
export const AVATAR_MAX_CHARS = 80_000;

export type Relation =
  "self" | "friends" | "outgoing" | "incoming" | "blocked" | "blockedBy" | "none";

/** Убирает управляющие символы, схлопывает пробелы по краям и режет по длине. */
export function cleanText(input: unknown, max: number, multiline = false): string {
  if (typeof input !== "string") return "";
  const stripped = input.replace(
    multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g,
    "",
  );
  return stripped.trim().slice(0, max);
}

/** Фото — маленькая картинка в виде data URL (jpeg/png/webp). */
export function isValidAvatar(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= AVATAR_MAX_CHARS &&
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}

export function relationOf(opts: {
  self?: boolean;
  blockedByMe: boolean;
  blockedMe: boolean;
  friendship?: { requesterId: string; status: "pending" | "accepted" } | null;
  me: string;
}): Relation {
  if (opts.self) return "self";
  if (opts.blockedByMe) return "blocked";
  if (opts.blockedMe) return "blockedBy";
  const f = opts.friendship;
  if (!f) return "none";
  if (f.status === "accepted") return "friends";
  return f.requesterId === opts.me ? "outgoing" : "incoming";
}

/** Регистронезависимое сравнение (SQLite LIKE не понимает кириллицу, поэтому ищем в коде). */
export function nameMatches(name: string | null, query: string): boolean {
  if (!name) return false;
  return name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

export function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((p) => Array.from(p)[0]!.toLocaleUpperCase())
    .join("");
}

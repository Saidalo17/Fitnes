import type { Locale } from "./config";

/** Выбирает текст каталога (упражнения/тренировки) для языка; запасной — русский. */
export function localized(locale: Locale, ru: string, en?: string | null): string {
  return locale === "en" && en ? en : ru;
}

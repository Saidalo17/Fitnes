import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { createT, getMessages } from "./translate";

/** Язык: cookie → Accept-Language → русский по умолчанию. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  if (accept.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: createT(getMessages(locale)) };
}

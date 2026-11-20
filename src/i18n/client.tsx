"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Messages } from "./messages/ru";
import { createT, type TFunction } from "./translate";

type Ctx = { locale: Locale; t: TFunction };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: createT(messages) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export const useT = () => useI18n().t;

import { en } from "./messages/en";
import { ru, type Messages } from "./messages/ru";
import type { Locale } from "./config";

type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Paths<Messages>;
export type TFunction = (key: MessageKey, params?: Record<string, string | number>) => string;

const dictionaries: Record<Locale, Messages> = { ru, en };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export function createT(messages: Messages): TFunction {
  return (key, params) => {
    let cur: unknown = messages;
    for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
    if (typeof cur !== "string") return key;
    return params
      ? cur.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m))
      : cur;
  };
}

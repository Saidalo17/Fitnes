import { cookies } from "next/headers";

export const TZ_COOKIE = "tz";
export const FX_COOKIE = "fx";

/** Смещение часового пояса пользователя в минутах (восток — плюс). Cookie ставит клиент. */
export async function getTzOffset(): Promise<number> {
  const raw = Number((await cookies()).get(TZ_COOKIE)?.value);
  return Number.isFinite(raw) && Math.abs(raw) <= 14 * 60 ? Math.round(raw) : 0;
}

/** Выключены ли анимации и конфетти (настройка пользователя). */
export async function getReduceEffects(): Promise<boolean> {
  return (await cookies()).get(FX_COOKIE)?.value === "off";
}

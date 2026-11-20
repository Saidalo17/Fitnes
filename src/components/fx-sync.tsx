"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Настройка «Анимации и конфетти» хранится в базе (общая для всех устройств),
 * а сайт быстро читает её из cookie. На новом устройстве cookie ещё нет —
 * подтягиваем значение из базы один раз.
 */
export function FxSync({ wantOff, currentOff }: { wantOff: boolean; currentOff: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (wantOff === currentOff) return;
    document.cookie = `fx=${wantOff ? "off" : "on"}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [wantOff, currentOff, router]);
  return null;
}

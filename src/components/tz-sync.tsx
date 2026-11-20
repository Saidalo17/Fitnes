"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Запоминает часовой пояс устройства в cookie (сервер считает серии и недели по нему). */
export function TzSync({ current }: { current: number }) {
  const router = useRouter();
  useEffect(() => {
    const offset = -new Date().getTimezoneOffset(); // восток — плюс
    if (offset === current) return;
    document.cookie = `tz=${offset}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [current, router]);
  return null;
}

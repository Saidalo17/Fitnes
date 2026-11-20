"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    // подробности остаются только в логах сервера/консоли; пользователю — понятный текст
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-extrabold">{t("errors.pageTitle")}</h1>
      <p className="text-muted">{t("errors.pageText")}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>{t("errors.tryAgain")}</Button>
        <Link href="/" className={buttonStyles("secondary")}>
          {t("errors.goHome")}
        </Link>
      </div>
    </main>
  );
}

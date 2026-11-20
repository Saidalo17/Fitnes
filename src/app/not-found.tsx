import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="num text-7xl text-accent-text">404</p>
      <h1 className="text-3xl font-extrabold">{t("errors.notFoundTitle")}</h1>
      <p className="text-muted">{t("errors.notFoundText")}</p>
      <Link href="/" className={buttonStyles()}>
        {t("errors.goHome")}
      </Link>
    </main>
  );
}

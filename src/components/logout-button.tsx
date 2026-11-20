"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { useT } from "@/i18n/client";

export function LogoutButton({ withLabel = false }: { withLabel?: boolean }) {
  const t = useT();
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label={t("common.logout")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-3 text-sm font-semibold transition active:scale-95"
      >
        <LogOut size={20} />
        {withLabel && t("common.logout")}
      </button>
    </form>
  );
}

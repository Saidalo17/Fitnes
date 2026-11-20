import { Mail } from "lucide-react";
import { LevelCard } from "@/components/gamification/level-card";
import { Card } from "@/components/ui/card";
import type { TFunction } from "@/i18n/translate";
import { Avatar } from "./avatar";

/** Визитка: то, что видят друзья — фото, имя, статус, «О себе»; ниже — уровень. */
export function ProfileHeader({
  name,
  email,
  avatar,
  status,
  bio,
  xp,
  t,
}: {
  name: string;
  email: string;
  avatar: string | null;
  status: string | null;
  bio: string | null;
  xp: number;
  t: TFunction;
}) {
  return (
    <section className="flex flex-col gap-4" aria-label={t("profile.title")}>
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
        <Avatar src={avatar} name={name} size={96} className="self-start" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-3xl font-extrabold sm:text-4xl">{name || "—"}</h1>
          {status && <p className="mt-1 font-semibold text-accent-text">{status}</p>}
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Mail size={14} aria-hidden /> <span className="truncate">{email}</span>
          </p>
          <h2 className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted">
            {t("profile.about")}
          </h2>
          <p className="mt-1 whitespace-pre-wrap break-words">
            {bio || <span className="text-muted">{t("social.noBio")}</span>}
          </p>
        </div>
      </Card>
      <LevelCard xp={xp} t={t} />
    </section>
  );
}

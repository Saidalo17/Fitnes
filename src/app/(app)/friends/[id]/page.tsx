import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/social/avatar";
import { PersonActions } from "@/components/social/person-actions";
import { Card } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { requireUserId } from "@/lib/session";
import { getPublicProfile } from "@/lib/social-data";
import { levelInfo } from "@/lib/xp";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUserId();
  const { id } = await params;
  const { t } = await getT();
  const p = await getPublicProfile(me, id);
  if (!p) notFound();
  const full = p.relation === "friends" || p.relation === "self";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        href="/friends"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg"
      >
        <ChevronLeft size={16} /> {t("social.back")}
      </Link>
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar src={p.avatar} name={p.name} size={88} />
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-extrabold">{p.name}</h1>
            {full && p.xp != null && (
              <p className="text-sm text-muted">
                {t("social.level", { n: levelInfo(p.xp).level })}
              </p>
            )}
            {full && (
              <p className="mt-1 font-semibold text-accent-text">
                {p.status ?? t("social.noStatus")}
              </p>
            )}
          </div>
        </div>
        {full ? (
          <p className="whitespace-pre-wrap text-fg">{p.bio ?? t("social.noBio")}</p>
        ) : (
          <p className="text-sm text-muted">{t("social.friendsOnly")}</p>
        )}
        {p.relation === "blocked" && (
          <p className="text-sm text-muted">{t("social.blockedNote")}</p>
        )}
        {p.relation !== "self" && <PersonActions id={p.id} relation={p.relation} />}
      </Card>
    </div>
  );
}

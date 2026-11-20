import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/social/avatar";
import { ChatView } from "@/components/social/chat-view";
import { getT } from "@/i18n/server";
import { requireUserId } from "@/lib/session";
import { getConversation, getPublicProfile } from "@/lib/social-data";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUserId();
  const { id } = await params;
  const { t } = await getT();
  const p = await getPublicProfile(me, id);
  if (!p || p.relation !== "friends") notFound();
  const initial = await getConversation(me, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/friends"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg"
      >
        <ChevronLeft size={16} /> {t("social.back")}
      </Link>
      <Link href={`/friends/${p.id}`} className="flex items-center gap-3">
        <Avatar src={p.avatar} name={p.name} size={48} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">
            {t("social.chatWith", { name: p.name })}
          </h1>
          {p.status && <p className="truncate text-sm text-muted">{p.status}</p>}
        </div>
      </Link>
      <ChatView otherId={p.id} initial={initial} />
    </div>
  );
}

import Link from "next/link";
import { Avatar } from "@/components/social/avatar";
import { buttonStyles } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { requireUserId } from "@/lib/session";
import { listConversations } from "@/lib/social-data";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("social.chats.title")} — Fitnes` };
}

export default async function ChatListPage() {
  const me = await requireUserId();
  const { t, locale } = await getT();
  const list = await listConversations(me);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const fmt = (ms: number) => {
    const d = new Date(ms);
    return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("social.chats.title")}</h1>
        <p className="mt-1 text-muted">{t("social.chats.subtitle")}</p>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-md border border-line bg-surface p-5">
          <p className="text-muted">{t("social.chats.empty")}</p>
          <Link href="/friends" className={buttonStyles("primary")}>
            {t("social.chats.findFriends")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="flex items-center gap-3 rounded-md border border-line bg-surface p-3 transition hover:border-accent"
              >
                <Avatar src={c.avatar} name={c.name} size={52} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{c.name}</span>
                    {c.last && (
                      <span className="num shrink-0 text-xs text-muted">{fmt(c.last.at)}</span>
                    )}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {c.last
                      ? `${c.last.mine ? t("social.chats.you") + ": " : ""}${c.last.body}`
                      : t("social.chats.noMessages")}
                  </span>
                </span>
                {c.unread > 0 && (
                  <span
                    aria-label={t("social.unread", { n: c.unread })}
                    className="num grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold leading-6 text-on-accent"
                  >
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

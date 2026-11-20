"use client";

import Link from "next/link";
import { useT } from "@/i18n/client";
import { Avatar } from "./avatar";
import { PeopleSearch } from "./people-search";
import { PersonActions } from "./person-actions";

type Friend = {
  id: string;
  name: string;
  avatar: string | null;
  status: string | null;
  unread: number;
};
type Req = { id: string; name: string; avatar: string | null };

export function FriendsView({
  friends,
  requests,
  blocked,
}: {
  friends: Friend[];
  requests: Req[];
  blocked: { id: string; name: string | null }[];
}) {
  const t = useT();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("social.title")}</h1>
        <p className="mt-1 text-muted">{t("social.subtitle")}</p>
      </div>

      <PeopleSearch />

      {requests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">{t("social.requests")}</h2>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-accent bg-surface p-3"
              >
                <Link
                  href={`/friends/${r.id}`}
                  className="flex flex-1 items-center gap-3 font-semibold"
                >
                  <Avatar src={r.avatar} name={r.name} />
                  {r.name}
                </Link>
                <PersonActions id={r.id} relation="incoming" compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t("social.friends")}</h2>
        {friends.length === 0 ? (
          <p className="text-muted">{t("social.noFriends")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((f) => (
              <li key={f.id}>
                <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-3">
                  <Link
                    href={`/friends/${f.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar src={f.avatar} name={f.name} size={48} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{f.name}</span>
                      {f.status && (
                        <span className="block truncate text-sm text-muted">{f.status}</span>
                      )}
                    </span>
                  </Link>
                  <Link
                    href={`/chat/${f.id}`}
                    className="inline-flex h-9 items-center rounded-sm bg-accent px-3 text-sm font-semibold text-on-accent hover:bg-accent-hover"
                  >
                    {t("social.message")}
                    {f.unread > 0 && (
                      <span
                        aria-label={t("social.unread", { n: f.unread })}
                        className="num ml-2 rounded-full bg-surface px-1.5 text-xs text-accent-text"
                      >
                        {f.unread}
                      </span>
                    )}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {blocked.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("social.blockedList")}</h2>
          <ul className="flex flex-col gap-2">
            {blocked.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line p-3"
              >
                <span>{b.name ?? "—"}</span>
                <PersonActions id={b.id} relation="blocked" compact />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

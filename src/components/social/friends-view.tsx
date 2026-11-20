"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { searchPeopleAction } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/client";
import { SEARCH_MIN } from "@/lib/social";
import type { PersonCard } from "@/lib/social-data";
import { Avatar } from "./avatar";
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
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonCard[] | null>(null);
  const [pending, start] = useTransition();

  function runSearch() {
    if (Array.from(q.trim()).length < SEARCH_MIN) return;
    start(async () => setResults(await searchPeopleAction(q)));
  }
  function search(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold lg:text-5xl">{t("social.title")}</h1>
        <p className="mt-1 text-muted">{t("social.subtitle")}</p>
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold">
            {t("social.searchLabel")}
            <input
              value={q}
              maxLength={60}
              placeholder={t("social.searchPlaceholder")}
              onChange={(e) => setQ(e.target.value)}
              className="h-12 rounded-sm bg-surface-2 px-3 text-base font-normal outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <Button type="submit" disabled={pending}>
            {t("social.search")}
          </Button>
        </form>
        {results && (
          <ul className="flex flex-col gap-2" aria-label={t("social.search")}>
            {results.length === 0 && (
              <li className="text-sm text-muted">{t("social.noResults")}</li>
            )}
            {results.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3"
              >
                <Link
                  href={`/friends/${p.id}`}
                  className="flex flex-1 items-center gap-3 font-semibold"
                >
                  <Avatar src={p.avatar} name={p.name} />
                  {p.name}
                </Link>
                <PersonActions id={p.id} relation={p.relation} compact onChanged={runSearch} />
              </li>
            ))}
          </ul>
        )}
      </Card>

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

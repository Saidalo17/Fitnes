"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useState, useTransition } from "react";
import { searchPeopleAction } from "@/actions/social";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/client";
import { SEARCH_MIN } from "@/lib/social";
import type { PersonCard } from "@/lib/social-data";
import { Avatar } from "./avatar";
import { PersonActions } from "./person-actions";

/** Поиск людей по имени + кнопки «добавить в друзья». Используется на главной, в профиле и в «Друзьях». */
export function PeopleSearch({
  showFriendsLink = false,
  requests = 0,
}: {
  showFriendsLink?: boolean;
  requests?: number;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonCard[] | null>(null);
  const [pending, start] = useTransition();

  function runSearch() {
    if (Array.from(q.trim()).length < SEARCH_MIN) return;
    start(async () => setResults(await searchPeopleAction(q)));
  }

  return (
    <Card className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold sm:text-2xl">{t("social.findPeople")}</h2>
        {showFriendsLink && (
          <Link href="/friends" className={buttonStyles("secondary", "sm")}>
            <Users size={16} />
            {t("social.friends")}
            {requests > 0 && (
              <span className="num rounded-full bg-accent px-1.5 text-xs text-on-accent">
                {requests}
              </span>
            )}
          </Link>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
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
          {results.length === 0 && <li className="text-sm text-muted">{t("social.noResults")}</li>}
          {results.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3"
            >
              <Link
                href={`/friends/${p.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 font-semibold"
              >
                <Avatar src={p.avatar} name={p.name} />
                <span className="truncate">{p.name}</span>
              </Link>
              <PersonActions id={p.id} relation={p.relation} compact onChanged={runSearch} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

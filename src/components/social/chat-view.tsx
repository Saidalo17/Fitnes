"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { MESSAGE_MAX } from "@/lib/social";
import type { ChatMessage } from "@/lib/social-data";

const POLL_MS = 3000;

export function ChatView({ otherId, initial }: { otherId: string; initial: ChatMessage[] }) {
  const t = useT();
  const [list, setList] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const lastId = useRef(initial.at(-1)?.id ?? 0);
  const box = useRef<HTMLUListElement>(null);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setList((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const add = incoming.filter((m) => !seen.has(m.id));
      return add.length ? [...prev, ...add].sort((a, b) => a.id - b.id) : prev;
    });
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
  }, []);

  // Опрос новых сообщений, пока вкладка видна.
  useEffect(() => {
    let stopped = false;
    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/chat/${otherId}?after=${lastId.current}`, {
          cache: "no-store",
        });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (!stopped) merge(data.messages);
      } catch {
        /* нет связи — попробуем в следующий раз */
      }
    }
    const id = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [otherId, merge]);

  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    start(async () => {
      const res = await sendMessage(otherId, body);
      if (res.ok && res.message) {
        merge([res.message]);
        setText("");
        setErr("");
      } else setErr(res.error ?? t("errors.generic"));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul
        ref={box}
        aria-live="polite"
        aria-label={t("social.inputLabel")}
        className="flex h-[calc(100dvh-22rem)] min-h-64 flex-col overflow-y-auto gap-2 rounded-md border border-line bg-surface p-3"
      >
        {list.length === 0 && (
          <li className="m-auto text-sm text-muted">{t("social.noMessages")}</li>
        )}
        {list.map((m) => (
          <li
            key={m.id}
            className={cn(
              "max-w-[80%] whitespace-pre-wrap break-words rounded-md px-3 py-2 text-sm",
              m.mine ? "self-end bg-accent text-on-accent" : "self-start bg-surface-2 text-fg",
            )}
          >
            {m.body}
            <span
              className={cn(
                "num mt-1 block text-[10px]",
                m.mine ? "text-on-accent/80" : "text-muted",
              )}
            >
              {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
          <span className="sr-only">{t("social.inputLabel")}</span>
          <textarea
            rows={2}
            value={text}
            maxLength={MESSAGE_MAX}
            placeholder={t("social.placeholder")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            className="rounded-sm bg-surface-2 px-3 py-2 text-base font-normal outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <Button type="submit" disabled={pending || !text.trim()}>
          {t("social.send")}
        </Button>
      </form>
      {err && (
        <p role="alert" className="text-sm text-danger-text">
          {err}
        </p>
      )}
    </div>
  );
}

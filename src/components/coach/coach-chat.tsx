"use client";

import { Bot, SendHorizontal, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { clearChat } from "@/actions/coach";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { COACH_MAX_CHARS } from "@/lib/coach";

type Msg = { id: string; role: "user" | "assistant"; content: string; error?: boolean };

export function CoachChat({
  initial,
  configured,
}: {
  initial: { id: number; role: "user" | "assistant"; content: string }[];
  configured: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(
    initial.map((m) => ({ id: `db-${m.id}`, role: m.role, content: m.content })),
  );
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [clearing, startClear] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  const examples = [t("coach.examples.one"), t("coach.examples.two"), t("coach.examples.three")];
  const canSend = configured && !busy && text.trim().length > 0 && text.length <= COACH_MAX_CHARS;

  async function send(value: string) {
    const message = value.trim();
    if (!message || busy || !configured) return;
    setText("");
    setBusy(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: message }]);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (res.ok && data.reply) {
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: "assistant", content: data.reply! },
        ]);
      } else {
        const key =
          data.error === "rate_limited"
            ? "coach.tooMany"
            : data.error === "not_configured"
              ? "coach.notConfigured"
              : "coach.error";
        setMessages((m) => [
          ...m,
          { id: `e-${Date.now()}`, role: "assistant", content: t(key), error: true },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, role: "assistant", content: t("coach.error"), error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold lg:text-5xl">{t("coach.title")}</h1>
          <p className="mt-1 text-muted">{t("coach.subtitle")}</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            disabled={clearing}
            onClick={() =>
              startClear(async () => {
                await clearChat();
                setMessages([]);
                router.refresh();
              })
            }
          >
            <Trash2 size={14} /> {t("coach.clear")}
          </Button>
        )}
      </div>

      {!configured && (
        <p role="status" className="rounded-md border border-line bg-surface-2 p-4 text-sm">
          {t("coach.notConfigured")}
        </p>
      )}

      <div
        className="flex min-h-64 flex-col gap-3 rounded-md border border-line bg-surface p-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3 py-4">
            <p className="text-sm text-muted">{t("coach.empty")}</p>
            <div className="flex flex-col gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={!configured || busy}
                  onClick={() => send(ex)}
                  className="rounded-sm border border-line bg-surface px-3 py-2.5 text-left text-sm transition hover:bg-surface-2 disabled:opacity-60"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  m.role === "user" ? "bg-surface-2 text-fg" : "bg-accent text-on-accent",
                )}
                aria-hidden="true"
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </span>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm leading-relaxed",
                  m.role === "user" ? "bg-accent-soft" : "bg-surface-2",
                  m.error && "text-danger-text",
                )}
              >
                <span className="sr-only">
                  {m.role === "user" ? t("coach.you") : t("coach.assistant")}:{" "}
                </span>
                {m.content}
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
              <Bot size={16} />
            </span>
            <span className="animate-pulse">{t("coach.thinking")}</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="coach-input" className="sr-only">
          {t("coach.inputLabel")}
        </label>
        <textarea
          id="coach-input"
          value={text}
          rows={2}
          maxLength={COACH_MAX_CHARS}
          disabled={!configured}
          placeholder={t("coach.placeholder")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) void send(text);
            }
          }}
          className="w-full resize-none rounded-sm border-2 border-transparent bg-surface-2 px-4 py-3 text-base outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="num text-xs text-muted">
            {text.length}/{COACH_MAX_CHARS}
          </span>
          <Button type="submit" disabled={!canSend}>
            <SendHorizontal size={16} /> {t("coach.send")}
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted">{t("coach.disclaimer")}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  blockUser,
  removeFriend,
  reportUser,
  respondFriendRequest,
  sendFriendRequest,
  unblockUser,
  type SocialResult,
} from "@/actions/social";
import { Button, buttonStyles } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { REPORT_MAX, type Relation } from "@/lib/social";

/** Кнопки действий над человеком — зависят от отношений (друг, запрос, блокировка). */
export function PersonActions({
  id,
  relation,
  compact = false,
  onChanged,
}: {
  id: string;
  relation: Relation;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);

  const run = (fn: () => Promise<SocialResult>) =>
    start(async () => {
      const res = await fn();
      setErr(res.ok ? "" : (res.error ?? t("errors.generic")));
      if (res.ok) {
        router.refresh();
        onChanged?.();
      }
    });

  const size = compact ? "sm" : "md";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {relation === "none" && (
          <Button size={size} disabled={pending} onClick={() => run(() => sendFriendRequest(id))}>
            {t("social.add")}
          </Button>
        )}
        {relation === "outgoing" && (
          <Button
            size={size}
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => removeFriend(id))}
          >
            {t("social.requestSent")} · {t("social.cancelRequest")}
          </Button>
        )}
        {relation === "incoming" && (
          <>
            <Button
              size={size}
              disabled={pending}
              onClick={() => run(() => respondFriendRequest(id, true))}
            >
              {t("social.accept")}
            </Button>
            <Button
              size={size}
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => respondFriendRequest(id, false))}
            >
              {t("social.decline")}
            </Button>
          </>
        )}
        {relation === "friends" && (
          <>
            <Link href={`/chat/${id}`} className={buttonStyles("primary", size)}>
              {t("social.message")}
            </Link>
            <Button
              size={size}
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => removeFriend(id))}
            >
              {t("social.remove")}
            </Button>
          </>
        )}
        {relation === "blocked" && (
          <Button
            size={size}
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => unblockUser(id))}
          >
            {t("social.unblock")}
          </Button>
        )}
        {!compact && relation !== "blocked" && relation !== "self" && (
          <Button
            size={size}
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => blockUser(id))}
          >
            {t("social.block")}
          </Button>
        )}
        {!compact && relation !== "self" && (
          <Button size={size} variant="ghost" onClick={() => setReporting((v) => !v)}>
            {t("social.report")}
          </Button>
        )}
      </div>
      {err && (
        <p role="alert" className="text-sm text-danger-text">
          {err}
        </p>
      )}
      {reporting && !reported && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t("social.reportReason")}
            <textarea
              rows={3}
              maxLength={REPORT_MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-sm bg-surface-2 px-3 py-2 text-base font-normal outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <Button
            size="sm"
            className="self-start"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await reportUser(id, reason);
                if (res.ok) setReported(true);
                return res;
              })
            }
          >
            {t("social.reportSend")}
          </Button>
        </div>
      )}
      {reported && (
        <p role="status" className="text-sm text-success">
          {t("social.reportSent")}
        </p>
      )}
    </div>
  );
}

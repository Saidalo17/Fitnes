"use client";

import { useRef, useState, useTransition } from "react";
import { saveSocialProfile } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/client";
import { BIO_MAX, STATUS_MAX } from "@/lib/social";
import { Avatar } from "./avatar";
import { resizeToAvatar } from "./resize-image";

const field =
  "w-full rounded-sm bg-surface-2 px-3 py-2 text-base text-fg outline-none focus:ring-2 focus:ring-accent";

export function MySocialProfile({
  name,
  initial,
}: {
  name: string;
  initial: { avatar: string | null; bio: string; status: string; discoverable: boolean };
}) {
  const t = useT();
  const [avatar, setAvatar] = useState(initial.avatar);
  const [changed, setChanged] = useState(false);
  const [bio, setBio] = useState(initial.bio);
  const [status, setStatus] = useState(initial.status);
  const [discoverable, setDiscoverable] = useState(initial.discoverable);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await resizeToAvatar(file));
      setChanged(true);
      setNote(null);
    } catch {
      setNote({ ok: false, text: t("social.errors.badImage") });
    }
  }

  function save() {
    start(async () => {
      const res = await saveSocialProfile({
        bio,
        status,
        discoverable,
        ...(changed ? { avatar } : {}),
      });
      setNote({ ok: res.ok, text: res.ok ? t("social.my.saved") : (res.error ?? "") });
      if (res.ok) setChanged(false);
    });
  }

  return (
    <Card className="flex flex-col gap-5 p-5">
      <h2 className="text-2xl font-bold">{t("social.my.title")}</h2>
      <div className="flex items-center gap-4">
        <Avatar src={avatar} name={name} size={72} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={t("social.my.photo")}
            data-testid="avatar-input"
            onChange={onFile}
          />
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            {t("social.my.upload")}
          </Button>
          {avatar && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAvatar(null);
                setChanged(true);
              }}
            >
              {t("social.my.removePhoto")}
            </Button>
          )}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("social.my.status")}
        <input
          className={field}
          value={status}
          maxLength={STATUS_MAX}
          onChange={(e) => setStatus(e.target.value)}
        />
        <span className="text-xs font-normal text-muted">
          {t("social.my.statusHint", { n: STATUS_MAX })}
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("social.my.bio")}
        <textarea
          className={field}
          rows={3}
          value={bio}
          maxLength={BIO_MAX}
          onChange={(e) => setBio(e.target.value)}
        />
        <span className="text-xs font-normal text-muted">
          {t("social.my.bioHint", { n: BIO_MAX })}
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-[var(--accent)]"
          checked={discoverable}
          onChange={(e) => setDiscoverable(e.target.checked)}
        />
        <span>
          <span className="font-semibold">{t("social.my.discoverable")}</span>
          <span className="block text-xs text-muted">{t("social.my.discoverableHint")}</span>
        </span>
      </label>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {t("social.my.save")}
        </Button>
        {note && (
          <p
            role="status"
            className={note.ok ? "text-sm text-success" : "text-sm text-danger-text"}
          >
            {note.text}
          </p>
        )}
      </div>
    </Card>
  );
}

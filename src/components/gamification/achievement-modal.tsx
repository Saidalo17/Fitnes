"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/i18n/client";
import type { AchievementCode } from "@/lib/achievements";
import { effectsAllowed } from "@/lib/effects";
import { AchievementIcon } from "./achievement-icon";

export type UnlockedItem = { code: AchievementCode; xpBonus: number };

/** Окно «Новое достижение!»: бейдж с анимацией и конфетти (если эффекты разрешены). */
export function AchievementModal({
  items,
  onClose,
}: {
  items: UnlockedItem[];
  onClose: () => void;
}) {
  const t = useT();
  const open = items.length > 0;

  useEffect(() => {
    if (!open || !effectsAllowed()) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.55 },
        colors: ["#e8450a", "#ff5a1f", "#e8a30a", "#ffffff"],
        zIndex: 100,
      });
    });
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={items.length > 1 ? t("achievements.unlockedMany") : t("achievements.unlockedOne")}
    >
      <ul className="mb-5 flex flex-col gap-3">
        {items.map((it, i) => (
          <motion.li
            key={it.code}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 260, damping: 18 }}
            className="flex items-center gap-3 rounded-md border border-line bg-surface-2 p-3"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
              <AchievementIcon code={it.code} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {t(`achievements.items.${it.code}.title`)}
              </span>
              <span className="block text-sm text-muted">
                {t(`achievements.items.${it.code}.desc`)}
              </span>
            </span>
            {it.xpBonus > 0 && (
              <span className="num shrink-0 text-sm text-accent-text">
                {t("achievements.bonus", { n: it.xpBonus })}
              </span>
            )}
          </motion.li>
        ))}
      </ul>
      <Button className="w-full" onClick={onClose}>
        {t("achievements.great")}
      </Button>
    </Modal>
  );
}

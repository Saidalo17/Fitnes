"use client";

import { Dumbbell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

type Props = {
  src?: string | null;
  poster?: string | null;
  label: string;
  className?: string;
};

/** Зацикленный ролик без звука; загружается, только когда попадает в экран. */
export function ExerciseVideo({ src, poster, label, className }: Props) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  const showVideo = !!src && !failed;

  return (
    <div
      ref={ref}
      className={cn("relative aspect-video overflow-hidden rounded-sm bg-surface-2", className)}
    >
      {showVideo && visible ? (
        <video
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          poster={poster ?? undefined}
          aria-label={label}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        >
          <source src={src!} type={src!.endsWith(".mp4") ? "video/mp4" : "video/webm"} />
        </video>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 text-muted">
          <Dumbbell size={28} strokeWidth={1.5} />
          {!showVideo && <span className="text-xs">{t("workouts.noVideo")}</span>}
        </div>
      )}
    </div>
  );
}

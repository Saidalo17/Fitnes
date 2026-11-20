"use client";

import { Dumbbell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ExerciseAnimation } from "./exercise-animation";

type Props = {
  src?: string | null;
  poster?: string | null;
  slug?: string | null;
  muscle?: string | null;
  label: string;
  className?: string;
};

/** Зацикленный ролик без звука; загружается, только когда попадает в экран. */
export function ExerciseVideo({ src, poster, slug, muscle, label, className }: Props) {
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
      ) : slug && !showVideo ? (
        <ExerciseAnimation slug={slug} muscle={muscle} label={label} />
      ) : (
        <div className="flex size-full items-center justify-center text-muted">
          <Dumbbell size={28} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

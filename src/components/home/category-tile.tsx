import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  icon: LucideIcon;
  title: string;
  hint: string;
  large?: boolean;
};

/** Плитка категории: ведёт в каталог с предустановленным фильтром. */
export function CategoryTile({ href, icon: Icon, title, hint, large }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between rounded-md border border-line bg-surface p-4 shadow-card",
        "transition hover:-translate-y-0.5 hover:border-accent active:scale-[0.98]",
        large ? "min-h-36" : "min-h-28",
      )}
    >
      <span className="grid size-10 place-items-center rounded-sm bg-accent-soft text-accent-text transition group-hover:bg-accent group-hover:text-on-accent">
        <Icon size={large ? 22 : 20} strokeWidth={1.75} />
      </span>
      <span>
        <span
          className={cn(
            "block font-display font-bold leading-tight",
            large ? "text-2xl" : "text-lg",
          )}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
    </Link>
  );
}

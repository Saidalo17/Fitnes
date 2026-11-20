import { cn } from "@/lib/cn";

/**
 * Появление блоков по очереди (fade + сдвиг 8px, 220ms, stagger 40ms) — чистым CSS,
 * без JS: контент виден в серверном HTML сразу, поэтому не задерживает LCP.
 * Анимации отключаются настройкой «Анимации и конфетти» и системным «уменьшить движение».
 */
export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("reveal-group", className)}>{children}</div>;
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("reveal-item", className)}>{children}</div>;
}

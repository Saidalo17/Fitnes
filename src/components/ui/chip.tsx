import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

export function Chip({ active, className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-sm text-sm font-medium transition active:scale-[0.97]",
        active
          ? "bg-accent text-on-accent"
          : "border border-line bg-surface text-fg hover:bg-surface-2",
        !className?.includes("px-") && "px-3",
        className,
      )}
      {...props}
    />
  );
}

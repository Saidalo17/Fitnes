import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-line bg-transparent text-fg hover:bg-surface-2",
  ghost: "bg-transparent text-fg hover:bg-surface-2",
};

/** Классы кнопки — чтобы стилизовать ссылки (<Link>) без вложения button в a. */
export function buttonStyles(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-sm px-5 font-semibold",
    "transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "h-12 text-base" : "h-9 px-3 text-sm",
    variants[variant],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonStyles(variant, size, className)} {...props} />
  );
});

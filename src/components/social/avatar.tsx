import { cn } from "@/lib/cn";
import { initials } from "@/lib/social";

/** Фото профиля (data URL) или буквы имени. */
export function Avatar({
  src,
  name,
  size = 44,
  className,
}: {
  src?: string | null;
  name: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={style}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-accent-text",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

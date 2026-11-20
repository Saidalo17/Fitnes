import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-line bg-surface p-4 shadow-card", className)}
      {...props}
    />
  );
}

import { Skeleton } from "@/components/ui/skeleton";

/** Мгновенная заглушка при переходе между разделами — пока сервер готовит страницу. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" role="status">
      <span className="sr-only">…</span>
      <Skeleton className="h-12 w-64 max-w-full" />
      <Skeleton className="h-6 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}

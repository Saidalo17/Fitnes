import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TFunction } from "@/i18n/translate";

type Row = { label: string; value: string };

/** Карточка графика: заголовок, график и текстовая альтернатива (таблица). */
export function ChartCard({
  title,
  subtitle,
  t,
  rows,
  colLabel,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  t: TFunction;
  rows?: Row[];
  colLabel?: string;
  empty?: { text: string; href: string; cta: string };
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-line p-6">
          <div>
            <p className="font-semibold">{t("analytics.emptyTitle")}</p>
            <p className="text-sm text-muted">{empty.text}</p>
          </div>
          <Link href={empty.href} className={buttonStyles("secondary", "sm")}>
            {empty.cta}
          </Link>
        </div>
      ) : (
        <>
          {children}
          {rows && rows.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-muted hover:text-fg">
                {t("analytics.showTable")}
              </summary>
              <table className="mt-2 w-full text-left">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 pr-4 font-medium">{colLabel ?? t("analytics.colDate")}</th>
                    <th className="py-1 font-medium">{t("analytics.colValue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 pr-4 text-muted">{r.label}</td>
                      <td className="num py-1">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </>
      )}
    </Card>
  );
}

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { I18nProvider } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { getMessages } from "@/i18n/translate";
import { getReduceEffects } from "@/lib/prefs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
});

// viewport-fit=cover: контент учитывает «чёлку» и жесты телефона (safe-area)
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getT();
  const reduceEffects = await getReduceEffects();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang={locale}
      data-fx={reduceEffects ? "off" : undefined}
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          <Providers reduceEffects={reduceEffects} nonce={nonce}>
            {children}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}

"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";

export function Providers({
  children,
  reduceEffects = false,
  nonce,
}: {
  children: React.ReactNode;
  reduceEffects?: boolean;
  nonce?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {/* "always" — настройка пользователя; "user" — следуем системной настройке */}
      <MotionConfig reducedMotion={reduceEffects ? "always" : "user"}>{children}</MotionConfig>
    </ThemeProvider>
  );
}

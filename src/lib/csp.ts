/**
 * Content-Security-Policy с nonce для скриптов (генерируется на каждый запрос в proxy.ts).
 * Стили: 'unsafe-inline' нужен для style="..." из SSR (ширины шкал, кольцо недели);
 * риск минимален, скрипты при этом строго под nonce + 'strict-dynamic'.
 */
export function buildCsp(nonce: string, isDev: boolean) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self'${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

const PUBLIC_PATHS = ["/login", "/register"];
const isDev = process.env.NODE_ENV !== "production";

// Быстрая («оптимистичная») проверка по cookie сессии + CSP с nonce.
// Окончательная проверка — в layout защищённой зоны и в Server Actions.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!token && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (token && isPublic) return NextResponse.redirect(new URL("/", req.url));

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, isDev);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

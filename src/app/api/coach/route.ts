import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { askCoach } from "@/lib/coach-server";

// POST /api/coach { message } → ответ ИИ-помощника (только тренировки и питание).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // защита от межсайтовых запросов: Origin (если есть) должен совпадать с хостом
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { message?: unknown } | null;
  if (!body || typeof body.message !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await askCoach({
    userId: session.user.id,
    message: body.message,
    locale: await getLocale(),
  });

  const headers = { "Cache-Control": "private, no-store" };
  switch (result.status) {
    case "ok":
      return NextResponse.json({ reply: result.reply, onTopic: result.onTopic }, { headers });
    case "not_configured":
      return NextResponse.json({ error: "not_configured" }, { status: 503, headers });
    case "rate_limited":
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers });
    case "too_long":
      return NextResponse.json({ error: "too_long" }, { status: 400, headers });
    default:
      return NextResponse.json({ error: "error" }, { status: 502, headers });
  }
}

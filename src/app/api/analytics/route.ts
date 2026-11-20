import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { parseRange } from "@/lib/analytics";
import { getAnalytics } from "@/lib/analytics-data";
import { getTzOffset } from "@/lib/prefs";

// GET /api/analytics?range=7d|30d|90d|1y — только данные текущего пользователя.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const range = parseRange(req.nextUrl.searchParams.get("range"));
  const data = await getAnalytics(session.user.id, range, await getTzOffset());
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}

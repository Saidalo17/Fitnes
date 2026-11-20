import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { areFriends, getConversation } from "@/lib/social-data";

// GET /api/chat/<id>?after=<messageId> — новые сообщения диалога (только между друзьями).
export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { userId } = await ctx.params;
  if (!(await areFriends(me, userId)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0);
  const list = await getConversation(me, userId, Number.isInteger(after) && after > 0 ? after : 0);
  return NextResponse.json(
    { messages: list },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

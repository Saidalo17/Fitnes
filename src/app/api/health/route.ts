import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";

// GET /api/health — проверка после деплоя: приложение живо и видит базу.
// Никаких данных не раскрывает (ни адреса базы, ни ключей).
export async function GET() {
  try {
    await db.run(sql`select 1`);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

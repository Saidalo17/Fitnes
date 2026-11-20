import { signOut } from "@/lib/auth";

// Сбрасывает cookie сессии (например, если пользователь был удалён).
export async function GET() {
  await signOut({ redirectTo: "/login" });
}

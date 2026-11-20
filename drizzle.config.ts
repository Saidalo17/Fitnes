import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {
  // файла нет — используем локальную БД
}

const url = process.env.TURSO_DATABASE_URL || "file:local.db";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN || undefined },
});

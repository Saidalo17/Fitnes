import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Перед сборкой и запуском сервера: чистая локальная БД со схемой и каталогом.
function prepare() {
  for (const f of ["e2e.db", "e2e.db-journal", "e2e.db-wal", "e2e.db-shm"]) {
    rmSync(f, { force: true });
  }
  const env = { ...process.env, TURSO_DATABASE_URL: "file:e2e.db", TURSO_AUTH_TOKEN: "" };
  execSync("npx drizzle-kit push --force", { stdio: "inherit", env });
  execSync("npx tsx src/db/seed.ts", { stdio: "inherit", env });
}

prepare();

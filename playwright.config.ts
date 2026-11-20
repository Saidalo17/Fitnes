import { defineConfig } from "@playwright/test";

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;

// E2E идут на ЛОКАЛЬНОЙ базе (e2e.db), а не на облачной Turso.
const e2eEnv = {
  TURSO_DATABASE_URL: "file:e2e.db",
  TURSO_AUTH_TOKEN: "",
  ANTHROPIC_API_KEY: "", // в E2E ИИ не вызываем (платный внешний сервис)
  AUTH_URL: BASE,
  PORT: String(PORT),
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    locale: "ru-RU",
    // системный Edge: не нужно скачивать браузер Playwright
    channel: "msedge",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx tsx e2e/prepare-db.ts && npm run build && npx next start -p 3100",
    url: `${BASE}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: e2eEnv,
  },
});

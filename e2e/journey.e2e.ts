import { expect, test } from "@playwright/test";
import { watchBrowserErrors } from "./helpers";

// Сквозной путь нового пользователя: регистрация → анкета → тренировка → график.
test("регистрация → анкета → тренировка → аналитика", async ({ page }) => {
  const problems = watchBrowserErrors(page);
  const email = `e2e-${Date.now()}@example.test`;

  // 1. Регистрация
  await page.goto("/register");
  await page.getByLabel("Имя").fill("E2E Тест");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("E2eTest12345");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // 2. Анкета (5 шагов)
  const next = page.getByRole("button", { name: /^(Далее|Начать)$/ });
  await page.getByRole("radio", { name: "Мужской" }).click();
  await next.click();
  await next.click(); // рост и вес по умолчанию
  await page.getByRole("radio", { name: /Сбросить вес/ }).click();
  await next.click();
  await page.getByRole("radio", { name: "Дома" }).click();
  await next.click();
  await page.getByRole("radio", { name: "Новичок" }).click();
  await next.click();
  await expect(page.getByRole("heading", { name: /Привет, E2E!/ })).toBeVisible();

  // 3. Каталог → тренировка
  await page.goto("/workouts");
  await expect(page.getByRole("heading", { name: "Тренировки", level: 1 })).toBeVisible();
  await page.locator('a[href^="/workouts/"]').first().click();
  await page.getByRole("link", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/workout\/\d+\/run/);

  // 4. Прохождение: «Готово»/«Завершить», отдых пропускаем
  for (let i = 0; i < 120; i++) {
    if (await page.getByRole("heading", { name: "Тренировка завершена!" }).isVisible()) break;
    const skipRest = page.getByRole("button", { name: "Пропустить", exact: true });
    if (await skipRest.isVisible()) {
      await skipRest.click();
      continue;
    }
    const done = page.getByRole("button", { name: /^(Готово|Завершить)$/ });
    if (await done.isVisible()) await done.click();
    await page.waitForTimeout(120);
  }
  await expect(page.getByRole("heading", { name: "Тренировка завершена!" })).toBeVisible();
  // достижение «Первая тренировка»
  await expect(page.getByText("Первая тренировка")).toBeVisible();
  await page.getByRole("button", { name: "Отлично!" }).click();

  // 5. Аналитика: тренировка посчитана, график отрисован
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Аналитика", level: 1 })).toBeVisible();
  await expect(page.getByText("Тренировок", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  const kpi = page
    .locator("div", { hasText: /^Тренировок$/ })
    .first()
    .locator("xpath=following-sibling::div");
  await expect(kpi).toHaveText("1");

  // ни одной ошибки CSP / необработанных исключений за весь путь
  expect(problems).toEqual([]);
});

test("неавторизованный пользователь уходит на вход", async ({ page }) => {
  await page.goto("/workouts");
  await expect(page).toHaveURL(/\/login/);
  const res = await page.request.get("/api/analytics");
  expect(res.status()).toBe(401);
});

test("страница 404 и заголовки безопасности", async ({ page }) => {
  const res = await page.goto("/login");
  const h = res!.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-powered-by"]).toBeUndefined();

  // проверка живости для деплоя
  const health = await page.request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ ok: true });
});

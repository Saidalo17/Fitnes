import { expect, test } from "@playwright/test";
import { signUpAndOnboard, watchBrowserErrors } from "./helpers";

test("питание: цели, меню по цели, выбор продукта с ккал, вода", async ({ page }) => {
  const problems = watchBrowserErrors(page);
  await signUpAndOnboard(page, "food");
  await page.goto("/nutrition");

  await expect(page.getByRole("heading", { name: "Питание", level: 1 })).toBeVisible();
  await expect(page.getByText("Цель на день")).toBeVisible();
  await expect(page.getByText("Сбросить вес").first()).toBeVisible();
  // все четыре приёма пищи
  for (const meal of ["Завтрак", "Обед", "Ужин", "Перекус"]) {
    await expect(page.getByRole("heading", { name: meal })).toBeVisible();
  }

  // 1. Рекомендованное меню на завтрак добавляется целиком
  const remove = page.getByRole("button", { name: /^Удалить:/ });
  await expect(remove).toHaveCount(0);
  await page.getByRole("button", { name: "Добавить рекомендованное" }).first().click();
  await expect(remove.first()).toBeVisible();
  const afterSuggested = await remove.count();
  expect(afterSuggested).toBeGreaterThanOrEqual(3);

  // 2. Выбор продукта вручную: калории считаются по граммам
  await page.getByRole("button", { name: "Добавить продукт" }).nth(1).click(); // обед
  await page.getByPlaceholder("Поиск продукта").fill("Банан");
  await page.getByRole("button", { name: /Банан/ }).click();
  await page.getByLabel("Вес порции, г").fill("200");
  await expect(page.getByText(/^178 ккал/)).toBeVisible(); // 89 ккал/100 г × 2
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(remove).toHaveCount(afterSuggested + 1);

  // 3. Вода
  await page.getByRole("button", { name: "+250 мл" }).click();
  await expect(page.getByText(/^250 \/ \d+ мл$/)).toBeVisible();

  // 4. Удаление и сохранение после перезагрузки
  await remove.first().click();
  await expect(remove).toHaveCount(afterSuggested);
  await page.reload();
  await expect(remove).toHaveCount(afterSuggested);
  await expect(page.getByText(/^250 \/ \d+ мл$/)).toBeVisible();

  expect(problems).toEqual([]);
});

test("ИИ-помощник: без ключа не падает; API защищён", async ({ page, request }) => {
  // без входа — 401
  const anon = await request.post("/api/coach", { data: { message: "привет" } });
  expect(anon.status()).toBe(401);

  await signUpAndOnboard(page, "coach");
  await page.goto("/coach");
  await expect(page.getByRole("heading", { name: "ИИ-помощник", level: 1 })).toBeVisible();
  await expect(page.getByText("ANTHROPIC_API_KEY")).toBeVisible();
  await expect(page.getByRole("button", { name: "Отправить" })).toBeDisabled();

  // чужой Origin — 403 (защита от межсайтовых запросов)
  const evil = await page.request.post("/api/coach", {
    data: { message: "тренировка" },
    headers: { origin: "https://evil.example" },
  });
  expect(evil.status()).toBe(403);

  // неверная форма запроса — 400
  const bad = await page.request.post("/api/coach", { data: { nope: 1 } });
  expect(bad.status()).toBe(400);

  // ключ не задан — 503, но не 500
  const noKey = await page.request.post("/api/coach", {
    data: { message: "как делать приседания?" },
  });
  expect(noKey.status()).toBe(503);
});

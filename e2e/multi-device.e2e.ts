import { expect, test } from "@playwright/test";
import { signUpAndOnboard } from "./helpers";

// «Ноутбук» и «телефон» — два независимых браузерных контекста (без общих cookie и localStorage).
test("один аккаунт на двух устройствах: прогресс, достижения и настройки совпадают", async ({
  browser,
}) => {
  const laptop = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1280, height: 800 },
  });
  const a = await laptop.newPage();
  const email = await signUpAndOnboard(a, "multi");

  // Ноутбук: проходим тренировку целиком → достижение «Первая тренировка» и опыт
  await a.goto("/workouts");
  await a.locator('a[href^="/workouts/"]').first().click();
  await a.getByRole("link", { name: "Начать" }).click();
  for (let i = 0; i < 120; i++) {
    if (await a.getByRole("heading", { name: "Тренировка завершена!" }).isVisible()) break;
    const skipRest = a.getByRole("button", { name: "Пропустить", exact: true });
    if (await skipRest.isVisible()) {
      await skipRest.click();
      continue;
    }
    const done = a.getByRole("button", { name: /^(Готово|Завершить)$/ });
    if (await done.isVisible()) await done.click();
    await a.waitForTimeout(120);
  }
  await expect(a.getByRole("heading", { name: "Тренировка завершена!" })).toBeVisible();
  await a.getByRole("button", { name: "Отлично!" }).click();

  // Ноутбук: выключаем анимации и конфетти
  await a.goto("/profile");
  await a.getByRole("switch", { name: "Анимации и конфетти" }).click();
  await expect(a.locator("html")).toHaveAttribute("data-fx", "off");

  // Телефон: новый контекст, вход тем же аккаунтом
  const phone = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 375, height: 800 },
  });
  const b = await phone.newPage();
  await b.goto("/login");
  await b.getByLabel("Email").fill(email);
  await b.getByLabel("Пароль").fill("E2eTest12345");
  await b.getByRole("button", { name: "Войти" }).click();
  await expect(b.getByRole("heading", { name: /Привет, E2E!/ })).toBeVisible();

  // те же данные: серия, достижение, опыт
  await expect(b.getByText("1 дн.", { exact: true })).toBeVisible();
  await b.goto("/achievements");
  await expect(b.getByText("Получено: 1 из 7")).toBeVisible();
  await expect(b.getByRole("heading", { name: "Первая тренировка" })).toBeVisible();
  await expect(b.getByText(/Получено \d/)).toBeVisible();

  // та же аналитика
  await b.goto("/analytics");
  await expect(
    b
      .locator("div", { hasText: /^Тренировок$/ })
      .first()
      .locator("xpath=following-sibling::div"),
  ).toHaveText("1");

  // настройка эффектов подтянулась из базы на новом устройстве
  await expect(b.locator("html")).toHaveAttribute("data-fx", "off");

  await laptop.close();
  await phone.close();
});

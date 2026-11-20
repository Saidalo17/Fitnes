import { expect, type Page } from "@playwright/test";

/** Регистрирует нового пользователя и проходит анкету (дом / сбросить вес / новичок). */
export async function signUpAndOnboard(page: Page, label = "e2e", name = "E2E Тест") {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Имя").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("E2eTest12345");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  const next = page.getByRole("button", { name: /^(Далее|Начать)$/ });
  await page.getByRole("radio", { name: "Мужской" }).click();
  await next.click();
  await next.click();
  await page.getByRole("radio", { name: /Сбросить вес/ }).click();
  await next.click();
  await page.getByRole("radio", { name: "Дома" }).click();
  await next.click();
  await page.getByRole("radio", { name: "Новичок" }).click();
  await next.click();
  await expect(
    page.getByRole("heading", { name: new RegExp(`Привет, ${name.split(" ")[0]}!`) }),
  ).toBeVisible();
  return email;
}

/** Собирает сообщения об ошибках CSP и необработанные исключения страницы. */
export function watchBrowserErrors(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /content security policy|refused to/i.test(m.text()))
      problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

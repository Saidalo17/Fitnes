import { expect, test } from "@playwright/test";
import { signUpAndOnboard } from "./helpers";

test("друзья и чат: поиск, запрос, статус, переписка, блокировка", async ({ browser }) => {
  const tag = String(Date.now()).slice(-6);
  const nameA = `Алиса${tag}`;
  const nameB = `Борис${tag}`;

  const ctxA = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1280, height: 800 },
  });
  const ctxB = await browser.newContext({ locale: "ru-RU", viewport: { width: 375, height: 800 } });
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();
  await signUpAndOnboard(a, "alice", nameA);
  await signUpAndOnboard(b, "boris", nameB);

  // Алиса заполняет публичный профиль
  await a.goto("/profile");
  await a.getByLabel(/^Статус/).fill("Сегодня ноги");
  await a.getByLabel("О себе").fill("Люблю приседания");
  await a.getByRole("button", { name: "Сохранить" }).last().click();
  await expect(a.getByText("Сохранено").last()).toBeVisible();

  // Борис находит Алису и отправляет запрос
  await b.goto("/friends");
  await b.getByLabel("Поиск по имени").fill(nameA.toLowerCase());
  await b.getByRole("button", { name: "Найти" }).click();
  await expect(b.getByText(nameA)).toBeVisible();
  // до дружбы описание и статус скрыты
  await expect(b.getByText("Сегодня ноги")).toHaveCount(0);
  await b.getByRole("button", { name: "Добавить в друзья" }).click();
  await expect(b.getByRole("button", { name: /Запрос отправлен/ })).toBeVisible();

  // Алиса видит запрос и принимает
  await a.goto("/friends");
  await expect(a.getByRole("heading", { name: "Запросы в друзья" })).toBeVisible();
  await a.getByRole("button", { name: "Принять" }).click();
  await expect(a.getByRole("heading", { name: "Мои друзья" })).toBeVisible();
  await expect(a.getByText(nameB)).toBeVisible();

  // Борис теперь видит статус и описание Алисы
  await b.goto("/friends");
  await expect(b.getByText("Сегодня ноги")).toBeVisible();
  await b
    .getByRole("link", { name: new RegExp(nameA) })
    .first()
    .click();
  await expect(b.getByText("Люблю приседания")).toBeVisible();

  // Борис пишет Алисе
  await b.getByRole("link", { name: "Написать" }).click();
  await b.getByPlaceholder("Напишите сообщение…").fill("Привет, Алиса!");
  await b.getByRole("button", { name: "Отправить" }).click();
  await expect(b.getByText("Привет, Алиса!")).toBeVisible();

  // у Алисы — непрочитанное, затем сообщение в чате
  await a.goto("/friends");
  await expect(a.getByLabel("Непрочитанных: 1")).toBeVisible();
  await a.getByRole("link", { name: /Написать/ }).click();
  await expect(a.getByText("Привет, Алиса!")).toBeVisible();

  // ответ приходит Борису сам (опрос раз в 3 секунды)
  await a.getByPlaceholder("Напишите сообщение…").fill("Привет, Борис!");
  await a.getByRole("button", { name: "Отправить" }).click();
  await expect(b.getByText("Привет, Борис!")).toBeVisible({ timeout: 15_000 });

  // Алиса блокирует Бориса — чат закрыт
  await a.goto("/friends");
  await a
    .getByRole("link", { name: new RegExp(nameB) })
    .first()
    .click();
  await a.getByRole("button", { name: "Заблокировать" }).click();
  await expect(a.getByRole("button", { name: "Разблокировать" })).toBeVisible();
  await b.getByPlaceholder("Напишите сообщение…").fill("Ещё одно");
  await b.getByRole("button", { name: "Отправить" }).click();
  await expect(b.getByRole("alert")).toBeVisible();

  await ctxA.close();
  await ctxB.close();
});

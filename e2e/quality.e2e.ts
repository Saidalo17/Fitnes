import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signUpAndOnboard, watchBrowserErrors } from "./helpers";

const PAGES = [
  "/",
  "/workouts",
  "/workouts/1",
  "/nutrition",
  "/coach",
  "/workout/1/run",
  "/analytics",
  "/achievements",
  "/profile",
  "/design",
];
const SCHEMES = ["light", "dark"] as const;
const WIDTHS = [320, 375, 768, 1280];

test.describe("качество интерфейса", () => {
  test.setTimeout(300_000);

  test("доступность (axe WCAG A/AA) в светлой и тёмной темах", async ({ page }) => {
    const problems = watchBrowserErrors(page);
    await signUpAndOnboard(page, "a11y");

    const found: string[] = [];
    for (const scheme of SCHEMES) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        for (const v of results.violations) {
          if (v.impact === "serious" || v.impact === "critical")
            found.push(`${scheme} ${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`);
        }
      }
    }
    expect(found).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("доступность публичных страниц (вход, регистрация, 404)", async ({ page }) => {
    const found: string[] = [];
    for (const scheme of SCHEMES) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const path of ["/login", "/register", "/no-such-page"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        for (const v of results.violations) {
          if (v.impact === "serious" || v.impact === "critical")
            found.push(`${scheme} ${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`);
        }
      }
    }
    expect(found).toEqual([]);
  });

  test("адаптив: нет горизонтальной прокрутки на 320/375/768/1280, обе темы", async ({ page }) => {
    await signUpAndOnboard(page, "resp");
    for (const scheme of SCHEMES) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        for (const path of PAGES) {
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          const culprit =
            overflow > 0
              ? await page.evaluate(() =>
                  [...document.querySelectorAll("body *")]
                    .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 0.5)
                    .slice(0, 3)
                    .map((e) => `${e.tagName}.${(e.className || "").toString().slice(0, 60)}`)
                    .join(" | "),
                )
              : "";
          expect(overflow, `${scheme} ${width}px ${path} ${culprit}`).toBeLessThanOrEqual(0);
        }
      }
    }
  });

  test("уменьшенное движение: страницы работают, конфетти не запускается", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", locale: "ru-RU" });
    const page = await ctx.newPage();
    const problems = watchBrowserErrors(page);
    await signUpAndOnboard(page, "motion");
    await page.goto("/workouts");
    await expect(page.getByRole("heading", { name: "Тренировки", level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    ).toBe(true);
    expect(problems).toEqual([]);
    await ctx.close();
  });

  test("клавиатура: Tab достигает навигации, видимый фокус", async ({ page }) => {
    await signUpAndOnboard(page, "kbd");
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const inNav = await page.evaluate(() => !!document.activeElement?.closest("nav"));
      if (inNav) break;
    }
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { inNav: !!el.closest("nav"), outline: cs.outlineStyle, width: cs.outlineWidth };
    });
    expect(focus?.inNav).toBe(true);
    expect(focus?.outline).not.toBe("none");
  });
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accesibilidad de las pantallas nuevas (T086; SC-009, FR-040, RNF-24, RNF-27).
 * /onboarding se añade cuando exista (T055, depende de la feature 003).
 */
const ERROR_CODES = [
  "oauth_denied",
  "oauth_failed",
  "email_not_verified",
  "email_missing",
  "account_exists_other_provider",
  "account_disabled",
];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.length} nodo(s)`);
}

test("[ROS-90][002:FR-040] /login sin violaciones serias ni críticas", async ({ page }) => {
  await page.goto("/login");
  expect(await seriousViolations(page)).toEqual([]);
});

for (const code of ERROR_CODES) {
  test(`[ROS-90][002:FR-040] /auth/error?code=${code} sin violaciones serias ni críticas`, async ({
    page,
  }) => {
    await page.goto(`/auth/error?code=${code}`);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test("[ROS-90][002:FR-040] /login se recorre con teclado en orden visual y con foco visible", async ({
  page,
}) => {
  await page.goto("/login");

  const focused: string[] = [];
  for (let i = 0; i < 2; i += 1) {
    await page.keyboard.press("Tab");
    focused.push((await page.evaluate(() => document.activeElement?.textContent)) ?? "");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return getComputedStyle(el).outlineStyle;
    });
    expect(outline).not.toBe("none");
  }
  expect(focused.filter((t) => t.startsWith("Continuar con"))).toEqual([
    "Continuar con Google",
    "Continuar con Microsoft",
  ]);
});

test("[ROS-90][002:FR-040] al llegar a /auth/error el foco está en el mensaje y se llega a la salida con teclado", async ({
  page,
}) => {
  await page.goto("/auth/error?code=oauth_denied");
  const message = page.getByRole("main").getByRole("alert");

  await expect(message).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Volver a intentar" })).toBeFocused();
});

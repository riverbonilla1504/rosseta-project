import { expect, test, type Browser, type Page } from "@playwright/test";

import { mockIdp, type MockIdentity } from "./support/mock-idp";

/**
 * Onboarding de la feature 002 (T052) y E2E-01 de docs/06-calidad/01-estrategia-de-pruebas.md
 * (T087; SC-001 de la 002 y SC-003 de la 003): acceso con el proveedor simulado → onboarding →
 * primer proyecto con el formulario real de la feature 003 → /projects. Sin interceptar
 * /api/projects: la feature 003 ya existe. Identidades sintéticas (RNF-38).
 */
const run = Date.now();

function identity(key: string): MockIdentity {
  return {
    sub: `google-oauth2|e2e-onb-${key}-${run}`,
    email: `onb-${key}-${run}@example.test`,
    name: `Persona ${key}`,
    email_verified: true,
  };
}

async function login(browser: Browser, who: MockIdentity, returnTo = "/"): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await mockIdp.setIdentity(who);
  await page.goto(`/auth/login?connection=google-oauth2&returnTo=${encodeURIComponent(returnTo)}`);
  await page.waitForURL((url) => ["/onboarding", "/projects"].includes(url.pathname));
  return page;
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-91][002:FR-017][002:FR-019][003:FR-002] E2E-01: primer acceso → onboarding con el nombre → primer proyecto → /projects", async ({
  browser,
}) => {
  const who = identity("e2e01");
  const page = await login(browser, who);

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hola, Persona e2e01. Crea tu primer proyecto para empezar.",
  );
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByLabel("Nombre del proyecto").fill("CORE_PRD");
  await page.getByLabel("SQL Server").check();
  await page.getByRole("button", { name: "Crear proyecto" }).click();

  await page.waitForURL((url) => url.pathname === "/projects");
  await expect(page.getByRole("link", { name: "CORE_PRD" })).toBeVisible();
  await page.goto("/onboarding");
  await page.waitForURL((url) => url.pathname === "/projects");
  const me = await page.request.get("/api/me");
  expect((await me.json()).onboarding_completed).toBe(true);
});

test("[ROS-91][002:FR-018] con el onboarding pendiente, una ruta privada por enlace directo lleva al onboarding", async ({
  browser,
}) => {
  const page = await login(browser, identity("directo"), "/projects");

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.goto("/projects");
  await page.waitForURL((url) => url.pathname === "/onboarding");
});

test("[ROS-91][002:FR-021] abandonarlo a medias y volver desde otro navegador lo retoma; completado no vuelve a salir", async ({
  browser,
}) => {
  const who = identity("retoma");
  const first = await login(browser, who);
  await first.getByLabel("Nombre del proyecto").fill("A medias");
  await first.context().close();

  const second = await login(browser, who);
  await expect(second).toHaveURL(/\/onboarding$/);
  await expect(second.getByLabel("Nombre del proyecto")).toHaveValue("");
  await second.getByLabel("Nombre del proyecto").fill("Ventas");
  await second.getByLabel("Oracle").check();
  await second.getByRole("button", { name: "Crear proyecto" }).click();
  await second.waitForURL((url) => url.pathname === "/projects");
  await second.context().close();

  const third = await login(browser, who, "/onboarding");
  await expect(third).toHaveURL(/\/projects$/);
  await expect(third.getByRole("link", { name: "Ventas" })).toBeVisible();
});

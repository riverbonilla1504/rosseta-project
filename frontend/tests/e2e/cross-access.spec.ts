import { expect, test, type Browser, type Page } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * E2E-09 de docs/06-calidad/01-estrategia-de-pruebas.md (T039 de la feature 003): la persona B
 * abre la dirección de un proyecto de A y ve la misma pantalla de "no encontrado" que con un
 * UUID inventado; ni su lista ni su selector muestran proyectos de A. Identidades sintéticas.
 */
const APP = "http://localhost:3100";
const run = Date.now();
const NOT_FOUND = "Este proyecto no existe o no tienes acceso.";

async function loginAs(browser: Browser, key: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-${key}-${run}`,
    email: `${key}-${run}@example.test`,
    name: `Persona ${key}`,
    email_verified: true,
  });
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/onboarding");
  const done = await page.request.post("/api/me/onboarding/complete", {
    headers: { origin: APP },
  });
  expect(done.ok()).toBe(true);
  return page;
}

async function createViaApi(page: Page, name: string): Promise<string> {
  const response = await page.request.post("/api/projects", {
    headers: { origin: APP },
    data: { name, source_dialect: "tsql" },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

async function mainText(page: Page, path: string): Promise<string> {
  await page.goto(path);
  await expect(page.getByText(NOT_FOUND)).toBeVisible();
  return page.locator("main").innerText();
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-84][003:FR-014][003:FR-015] B ve en el proyecto de A la misma pantalla de «no encontrado» que con un UUID inventado", async ({
  browser,
}) => {
  const ana = await loginAs(browser, "ana-cruzado");
  const secret = await createViaApi(ana, `Secreto de Ana ${run}`);
  const beto = await loginAs(browser, "beto-cruzado");

  const foreign = await mainText(beto, `/p/${secret}`);
  const madeUp = await mainText(beto, "/p/00000000-0000-4000-8000-000000000000");
  const malformed = await mainText(beto, "/p/no-es-un-uuid");

  expect(foreign).toBe(madeUp);
  expect(malformed).toBe(madeUp);
  expect(foreign).not.toContain("Secreto de Ana");
  await expect(beto.getByTestId("project-badge")).toHaveCount(0);
  await beto.getByRole("link", { name: "Ir a tus proyectos" }).click();
  await beto.waitForURL((url) => url.pathname === "/projects");
});

test("[ROS-84][003:FR-014] ni la lista ni el selector de B muestran proyectos de A", async ({
  browser,
}) => {
  const ana = await loginAs(browser, "ana-lista");
  await createViaApi(ana, `Secreto de Ana ${run}`);
  const beto = await loginAs(browser, "beto-lista");
  const mine = await createViaApi(beto, `Proyecto de Beto ${run}`);

  await beto.goto("/projects");
  await expect(beto.getByRole("link", { name: `Proyecto de Beto ${run}` })).toBeVisible();
  await expect(beto.getByText(/Secreto de Ana/)).toHaveCount(0);

  await beto.goto(`/p/${mine}`);
  const switcher = beto.getByRole("combobox", { name: "Cambiar de proyecto" });
  await expect(switcher.getByRole("option")).toHaveText([`Proyecto de Beto ${run}`]);
});

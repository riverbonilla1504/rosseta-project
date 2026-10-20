import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * Accesibilidad de las pantallas de la feature 003 (T061; SC-008, FR-029): /projects, el
 * formulario, el filtro, el selector, las pestañas, los diálogos de renombrar y archivar, el
 * aviso de solo lectura, la pantalla de "no encontrado" y /onboarding (el mismo formulario, T086
 * de la 002) sin violaciones serias ni críticas de axe y recorribles solo con teclado.
 */
const APP = "http://localhost:3100";
const run = Date.now();

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

async function login(page: Page, key: string, completeOnboarding = true) {
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-a11y-${key}-${run}`,
    email: `a11y-${key}-${run}@example.test`,
    name: `Persona ${key}`,
    email_verified: true,
  });
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/onboarding");
  if (completeOnboarding) {
    const done = await page.request.post("/api/me/onboarding/complete", {
      headers: { origin: APP },
    });
    expect(done.ok()).toBe(true);
  }
}

async function createViaApi(page: Page, name: string): Promise<string> {
  const response = await page.request.post("/api/projects", {
    headers: { origin: APP },
    data: { name, source_dialect: "tsql" },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

/** Pulsa Tab hasta llegar al elemento; falla si no llega o si el foco no se ve. */
async function tabTo(page: Page, name: string, max = 30) {
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return { label: "", outline: "none" };
      const label = el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "";
      return { label, outline: getComputedStyle(el).outlineStyle };
    });
    if (active.label === name) {
      expect(active.outline).not.toBe("none");
      return;
    }
  }
  throw new Error(`«${name}» no se alcanza con el teclado`);
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-78][003:FR-029] /projects con lista, filtro y formulario sin violaciones serias ni críticas", async ({
  page,
}) => {
  await login(page, "lista");
  await page.goto("/projects");
  await expect(page.getByText("Aún no tienes proyectos.")).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);

  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByText("Escribe un nombre para el proyecto.")).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);

  await createViaApi(page, "CORE_PRD");
  await page.reload();
  await expect(page.getByRole("link", { name: "CORE_PRD" })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
  await page.getByRole("button", { name: "Ver archivados" }).click();
  expect(await seriousViolations(page)).toEqual([]);
});

test("[ROS-78][003:FR-029] /projects se crea un proyecto solo con teclado y con el foco visible", async ({
  page,
}) => {
  await login(page, "teclado");
  await page.goto("/projects");
  await expect(page.getByText("Aún no tienes proyectos.")).toBeVisible();

  await tabTo(page, "Ver archivados");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Nombre del proyecto")).toBeFocused();
  await page.keyboard.type("Teclado");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("SQL Server")).toBeFocused();
  await page.keyboard.press("Space");
  await tabTo(page, "Crear proyecto");
  await page.keyboard.press("Enter");

  await page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("project-badge")).toHaveText("Teclado · tsql");
});

test("[ROS-78][003:FR-029] pestañas, selector y diálogos del proyecto sin violaciones y con teclado", async ({
  page,
}) => {
  await login(page, "proyecto");
  const id = await createViaApi(page, "Ventas");
  await createViaApi(page, "Compras");
  await page.goto(`/p/${id}`);
  await expect(page.getByTestId("project-badge")).toHaveText("Ventas · tsql");
  expect(await seriousViolations(page)).toEqual([]);

  for (const tab of ["Panorama", "Revisión", "Catálogo", "Fuentes"]) await tabTo(page, tab, 10);
  await tabTo(page, "Cambiar de proyecto");
  await tabTo(page, "Renombrar");
  await page.keyboard.press("Enter");
  const rename = page.getByRole("dialog", { name: "Renombrar proyecto" });
  await expect(rename.getByLabel("Nombre del proyecto")).toBeFocused();
  expect(await seriousViolations(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(rename).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Renombrar" })).toBeFocused();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  const archive = page.getByRole("dialog", { name: "Archivar Ventas" });
  await expect(archive.getByRole("button", { name: "Archivar", exact: true })).toBeFocused();
  expect(await seriousViolations(page)).toEqual([]);
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.pathname === "/projects");

  await page.goto(`/p/${id}`);
  await expect(page.getByText(/Proyecto archivado: solo lectura/)).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
  await tabTo(page, "Desarchivar");
});

test("[ROS-84][003:FR-029] «no encontrado» sin violaciones y su salida se alcanza con teclado", async ({
  page,
}) => {
  await login(page, "nf");
  await page.goto("/p/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("Este proyecto no existe o no tienes acceso.")).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
  await tabTo(page, "Ir a tus proyectos");
});

test("[ROS-91][002:FR-040] /onboarding sin violaciones serias ni críticas", async ({ page }) => {
  await login(page, "onb", false);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hola, Persona onb.");
  expect(await seriousViolations(page)).toEqual([]);
  await tabTo(page, "Crear proyecto");
});

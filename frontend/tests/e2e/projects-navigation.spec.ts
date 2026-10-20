import { expect, test, type Page } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * E2E de la historia 2 de la feature 003 (T032): crear desde /projects, abrir el proyecto con su
 * navegación y cambiar de proyecto sin mezclar datos (SC-004). Identidades sintéticas (RNF-38).
 */
const APP = "http://localhost:3100";
const run = Date.now();

async function loginWithOnboardingDone(page: Page, key: string) {
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
}

async function createViaApi(page: Page, name: string, source_dialect: string): Promise<string> {
  const response = await page.request.post("/api/projects", {
    headers: { origin: APP },
    data: { name, source_dialect },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

const badge = (page: Page) => page.getByTestId("project-badge");

/** Registra si el texto aparece en la insignia en cualquier momento desde ahora. */
async function watchBadgeFor(page: Page, text: string) {
  await page.evaluate((needle) => {
    const w = window as unknown as { __seen: boolean };
    w.__seen = false;
    const check = () => {
      const node = document.querySelector('[data-testid="project-badge"]');
      if (node?.textContent?.includes(needle)) w.__seen = true;
    };
    check();
    new MutationObserver(check).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }, text);
}

const seen = (page: Page) => page.evaluate(() => (window as unknown as { __seen: boolean }).__seen);

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-78][003:FR-001][003:FR-007][003:FR-008] crear «Ventas» con Oracle desde /projects entra en /p/{id} con su insignia y sus cuatro pestañas", async ({
  page,
}) => {
  await loginWithOnboardingDone(page, "crear");
  await page.goto("/projects");
  await expect(page.getByText("Aún no tienes proyectos.")).toBeVisible();

  await page.getByLabel("Nombre del proyecto").fill("Ventas");
  await page.getByLabel("Oracle").check();
  await page.getByRole("button", { name: "Crear proyecto" }).click();

  await page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  await expect(badge(page)).toHaveText("Ventas · oracle");
  const tabs = page.getByRole("navigation").getByRole("link");
  await expect(tabs).toHaveText(["Panorama", "Revisión", "Catálogo", "Fuentes"]);
  await expect(page.getByText(/Hallazgos|Generador/)).toHaveCount(0);

  await page.goto("/projects");
  await expect(page.getByRole("link", { name: "Ventas" })).toBeVisible();
});

test("[ROS-78][003:FR-009] cambiar de proyecto con la red lenta no muestra nada del anterior (SC-004)", async ({
  page,
}) => {
  await loginWithOnboardingDone(page, "cambiar");
  const ventas = await createViaApi(page, "Ventas", "oracle");
  const compras = await createViaApi(page, "Compras", "postgres");
  // El detalle de Ventas tarda más que el de Compras: llega cuando ya se está en Compras.
  await page.route(`**/api/projects/${ventas}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });
  await page.route(`**/api/projects/${compras}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });

  await page.goto(`/p/${ventas}`);
  const switcher = page.getByRole("combobox", { name: "Cambiar de proyecto" });
  await expect(switcher.getByRole("option")).toHaveCount(2);
  await watchBadgeFor(page, "Ventas");

  await switcher.selectOption(compras);

  await page.waitForURL(`**/p/${compras}`);
  await expect(badge(page)).toHaveText("Compras · postgres");
  // Se deja llegar la respuesta tardía de Ventas antes de comprobar.
  await page.waitForTimeout(3_500);
  await expect(badge(page)).toHaveText("Compras · postgres");
  expect(await seen(page)).toBe(false);
});

test("[ROS-78][003:FR-009] dos pestañas con proyectos distintos no se mezclan", async ({
  page,
  context,
}) => {
  await loginWithOnboardingDone(page, "pestanas");
  const ventas = await createViaApi(page, "Ventas", "oracle");
  const compras = await createViaApi(page, "Compras", "postgres");
  const other = await context.newPage();

  await page.goto(`/p/${ventas}`);
  await other.goto(`/p/${compras}`);
  await expect(badge(page)).toHaveText("Ventas · oracle");
  await expect(badge(other)).toHaveText("Compras · postgres");

  await page.reload();
  await other.getByRole("link", { name: "Revisión" }).click();
  await expect(badge(page)).toHaveText("Ventas · oracle");
  await expect(badge(other)).toHaveText("Compras · postgres");
});

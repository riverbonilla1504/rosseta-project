import { expect, test, type Page } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * Escenarios Q7, Q8 y Q9 del quickstart de la feature 003 (T057; FR-010, FR-012, FR-013):
 * archivar el proyecto abierto, abrir un archivado en solo lectura y desarchivar con el nombre
 * ocupado. Identidades sintéticas (RNF-38).
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

async function createViaApi(page: Page, name: string): Promise<string> {
  const response = await page.request.post("/api/projects", {
    headers: { origin: APP },
    data: { name, source_dialect: "oracle" },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

async function archiveFromInside(page: Page, id: string) {
  await page.goto(`/p/${id}`);
  await page.getByRole("button", { name: "Archivar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Archivar Ventas" });
  await dialog.getByRole("button", { name: "Archivar", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/projects");
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-78][003:FR-010][003:FR-012] Q7: archivar «Ventas» estando dentro vuelve a /projects y solo se ve con el filtro", async ({
  page,
}) => {
  await loginWithOnboardingDone(page, "q7");
  const ventas = await createViaApi(page, "Ventas");
  await createViaApi(page, "Compras");

  await archiveFromInside(page, ventas);

  await expect(page.getByRole("link", { name: "Compras" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ventas" })).toHaveCount(0);
  await page.getByRole("button", { name: "Ver archivados" }).click();
  await expect(page.getByRole("link", { name: "Ventas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Compras" })).toHaveCount(0);
});

test("[ROS-78][003:FR-013] Q8: un archivado se abre en solo lectura y no hay forma de modificarlo salvo desarchivar", async ({
  page,
}) => {
  await loginWithOnboardingDone(page, "q8");
  const ventas = await createViaApi(page, "Ventas");
  await archiveFromInside(page, ventas);

  await page.getByRole("button", { name: "Ver archivados" }).click();
  await page.getByRole("link", { name: "Ventas" }).click();
  await page.waitForURL(`**/p/${ventas}`);

  await expect(
    page.getByText("Proyecto archivado: solo lectura. Desarchívalo para hacer cambios."),
  ).toBeVisible();
  await expect(page.getByTestId("project-badge")).toHaveText("Ventas · oracle");
  await expect(page.getByRole("button", { name: "Renombrar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Cambiar de proyecto" })).toHaveCount(0);
  const rename = await page.request.patch(`/api/projects/${ventas}`, {
    headers: { origin: APP },
    data: { name: "Otro" },
  });
  expect(rename.status()).toBe(409);
});

test("[ROS-78][003:FR-004][003:FR-013] Q9: desarchivar con el nombre ocupado pide un nombre nuevo antes", async ({
  page,
}) => {
  await loginWithOnboardingDone(page, "q9");
  const old = await createViaApi(page, "Ventas");
  await archiveFromInside(page, old);
  await createViaApi(page, "Ventas");

  await page.goto(`/p/${old}`);
  await page.getByRole("button", { name: "Desarchivar" }).click();
  await expect(
    page.getByText(
      "Ya tienes un proyecto activo llamado Ventas. Elige otro nombre para desarchivarlo.",
    ),
  ).toBeVisible();
  await page.getByLabel("Nombre del proyecto").fill("Ventas 2025");
  await page.getByRole("button", { name: "Desarchivar" }).click();

  await expect(page.getByTestId("project-badge")).toHaveText("Ventas 2025 · oracle");
  await expect(page.getByText(/Proyecto archivado/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toBeVisible();
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: "Ventas 2025" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ventas", exact: true })).toBeVisible();
});

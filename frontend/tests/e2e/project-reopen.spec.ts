import { execSync } from "node:child_process";
import path from "node:path";

import { expect, test, type Browser, type Page } from "@playwright/test";

import { mockIdp, type MockIdentity } from "./support/mock-idp";

/**
 * El trabajo no se pierde (T049 de la feature 003; FR-021, SC-002): con CORE_DEMO sembrado, abrir
 * el proyecto, cerrar la sesión y volver a abrirlo desde otro contexto del navegador devuelve el
 * mismo estado. Identidad sintética; la siembra es el comando del equipo (FR-027).
 */
const APP = "http://localhost:3100";
const UV = process.env.E2E_UV ?? "uv run";
const run = Date.now();
const identity: MockIdentity = {
  sub: `google-oauth2|e2e-reabrir-${run}`,
  email: `reabrir-${run}@example.test`,
  name: "Persona Reabrir",
  email_verified: true,
};

async function login(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await mockIdp.setIdentity(identity);
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/projects");
  await page.waitForURL((url) => ["/onboarding", "/projects"].includes(url.pathname));
  return page;
}

function seedCoreDemo() {
  execSync(`${UV} python manage.py seed_reference_project --owner-sub "${identity.sub}"`, {
    cwd: path.resolve(__dirname, "../../../backend"),
    env: {
      ...process.env,
      DJANGO_SETTINGS_MODULE: "config.settings.dev",
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgres://rosetta:rosetta_dev_only@localhost:5433/rosetta",
    },
    stdio: "pipe",
  });
}

async function openCoreDemo(page: Page) {
  await page.goto("/projects");
  await page.getByRole("link", { name: "CORE_DEMO" }).click();
  await page.waitForURL(/\/p\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("project-badge")).toHaveText("CORE_DEMO · tsql");
  await expect(page.getByText("Panorama aún no está disponible.")).toBeVisible();
  const projectId = new URL(page.url()).pathname.split("/").pop() as string;
  const state = await page.request.get(`/api/projects/${projectId}/state`);
  expect(state.status()).toBe(200);
  return { projectId, state: await state.json(), text: await page.locator("main").innerText() };
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-81][003:FR-021] cerrar sesión y reabrir CORE_DEMO en otro navegador devuelve el mismo estado (SC-002)", async ({
  browser,
}) => {
  const first = await login(browser);
  const done = await first.request.post("/api/me/onboarding/complete", {
    headers: { origin: APP },
  });
  expect(done.ok()).toBe(true);
  seedCoreDemo();

  const before = await openCoreDemo(first);
  expect(before.state.queue_head[0].identifier).toBe("MOV0010.PGCOD");
  expect(before.state.coverage.by_level.CONFIRMED).toBe(3);
  await first.getByRole("link", { name: "Cerrar sesión" }).click();
  await first.waitForURL((url) => !url.pathname.startsWith("/p/"));
  await first.context().close();

  const second = await login(browser);
  const after = await openCoreDemo(second);

  expect(after.projectId).toBe(before.projectId);
  expect(after.state).toEqual(before.state);
  expect(after.text).toBe(before.text);
});

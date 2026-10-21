import { expect, test, type Page } from "@playwright/test";

import { mockIdp, type MockIdentity } from "./support/mock-idp";

/**
 * E2E de la historia 1 (T036): acceso con Google y Microsoft contra el proveedor simulado y el
 * backend real (PostgreSQL). Identidades sintéticas únicas por ejecución (RNF-38).
 */
const run = Date.now();
const identity = (key: string, overrides: Partial<MockIdentity> = {}): MockIdentity => ({
  sub: `google-oauth2|e2e-${key}-${run}`,
  email: `${key}-${run}@example.test`,
  name: `Persona ${key}`,
  email_verified: true,
  ...overrides,
});

async function login(page: Page, connection = "google-oauth2") {
  await page.goto(`/auth/login?connection=${connection}&returnTo=/`);
  await page.waitForURL((url) => url.pathname === "/onboarding");
}

async function logout(page: Page) {
  await page.goto(`/auth/logout?returnTo=${encodeURIComponent("http://localhost:3100/login")}`);
  await page.waitForURL((url) => url.pathname === "/login");
}

async function me(page: Page) {
  const response = await page.request.get("/api/me");
  expect(response.status()).toBe(200);
  return response.json();
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-90][002:FR-001] Google crea la cuenta en el primer acceso y lleva al onboarding", async ({
  page,
}) => {
  await mockIdp.setIdentity(identity("google"));

  await login(page, "google-oauth2");

  const account = await me(page);
  expect(account.email).toBe(`google-${run}@example.test`);
  expect(account.full_name).toBe("Persona google");
  expect(account.onboarding_completed).toBe(false);
});

test("[ROS-90][002:FR-001] Microsoft (cuenta personal) crea la cuenta en el primer acceso", async ({
  page,
}) => {
  await mockIdp.setIdentity(identity("microsoft", { sub: `windowslive|e2e-ms-${run}` }));

  await login(page, "windowslive");

  expect((await me(page)).email).toBe(`microsoft-${run}@example.test`);
});

test("[ROS-90][002:FR-005] el reingreso conserva la misma cuenta (SC-002)", async ({ page }) => {
  await mockIdp.setIdentity(identity("reingreso"));
  await login(page);
  const first = await me(page);

  await logout(page);
  await login(page);

  expect((await me(page)).id).toBe(first.id);
});

test("[ROS-91][002:FR-005] dos accesos simultáneos de la misma identidad producen una sola cuenta", async ({
  browser,
}) => {
  await mockIdp.setIdentity(identity("simultaneo"));
  const [a, b] = await Promise.all([browser.newContext(), browser.newContext()]);
  const [pageA, pageB] = await Promise.all([a.newPage(), b.newPage()]);

  await Promise.all([login(pageA), login(pageB)]);
  const [accountA, accountB] = await Promise.all([me(pageA), me(pageB)]);

  expect(accountA.id).toBe(accountB.id);
  await Promise.all([a.close(), b.close()]);
});

test("[ROS-90][002:FR-006] cambiar nombre, avatar o correo en el proveedor mantiene la cuenta (FR-007)", async ({
  page,
}) => {
  const base = identity("cambios");
  await mockIdp.setIdentity(base);
  await login(page);
  const before = await me(page);
  await logout(page);

  await mockIdp.setIdentity({
    ...base,
    name: "Nombre Nuevo",
    picture: "https://lh3.googleusercontent.com/e2e.png",
    email: `cambios-nuevo-${run}@example.test`,
  });
  await login(page);
  const after = await me(page);

  expect(after.id).toBe(before.id);
  expect(after.full_name).toBe("Nombre Nuevo");
  expect(after.avatar_url).toBe("https://lh3.googleusercontent.com/e2e.png");
  expect(after.email).toBe(`cambios-nuevo-${run}@example.test`);
});

test("[ROS-90][002:FR-005] dos identidades con correos distintos son dos cuentas independientes", async ({
  page,
}) => {
  await mockIdp.setIdentity(identity("persona-a"));
  await login(page, "google-oauth2");
  const a = await me(page);
  await logout(page);

  await mockIdp.setIdentity(identity("persona-b", { sub: `windowslive|e2e-b-${run}` }));
  await login(page, "windowslive");
  const b = await me(page);

  expect(b.id).not.toBe(a.id);
  expect(b.email).toBe(`persona-b-${run}@example.test`);
});

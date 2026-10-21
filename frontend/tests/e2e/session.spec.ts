import { expect, test, type Page } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * E2E de la historia 4 (T058): renovación silenciosa, cierre de sesión y dos pestañas.
 * El aviso de sesión vencida tras borrar __session (FR-026) necesita una pantalla que use
 * apiFetch; hasta que exista el onboarding (T055, feature 003) lo cubren las unitarias T057/T061.
 */
const run = Date.now();
const LOGIN_URL = "http://localhost:3100/login";

async function login(page: Page) {
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/onboarding");
}

async function logout(page: Page) {
  await page.goto(`/auth/logout?returnTo=${encodeURIComponent(LOGIN_URL)}`);
  await page.waitForURL((url) => url.pathname === "/login");
}

test.beforeEach(async ({}, testInfo) => {
  await mockIdp.reset();
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-sesion-${testInfo.title.length}-${run}`,
    email: `sesion-${testInfo.title.length}-${run}@example.test`,
    name: "Persona Sesión",
    email_verified: true,
  });
});

test("[ROS-92][002:FR-022] una sesión continua cruza al menos tres vencimientos de la credencial sin pantalla de acceso (SC-006, FR-023)", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await mockIdp.setAccessTokenTtl(4);
  await login(page);
  const first = await (await page.request.get("/api/me")).json();

  for (let expiry = 1; expiry <= 3; expiry += 1) {
    await page.waitForTimeout(5_000); // la credencial de 4 s ya venció
    await page.goto("/onboarding");
    expect(new URL(page.url()).pathname).toBe("/onboarding");
    const response = await page.request.get("/api/me");
    expect(response.status()).toBe(200);
    expect((await response.json()).id).toBe(first.id);
  }
});

test("[ROS-92][002:FR-023] si el proveedor rechaza la renovación (refresh token revocado o reutilizado), la sesión se cierra: la siguiente operación da 401", async ({
  page,
}) => {
  await mockIdp.setAccessTokenTtl(4);
  await login(page);
  await mockIdp.rejectRefresh();
  await page.waitForTimeout(5_000);

  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("[ROS-92][002:FR-025] cerrar sesión lleva a /login con returnTo aceptado por la lista blanca y nada más accede a datos (E2E-08)", async ({
  page,
}) => {
  await login(page);

  await logout(page);

  expect((await mockIdp.state()).logouts.at(-1)).toEqual({ target: LOGIN_URL, accepted: true });
  await page.goto("/onboarding");
  await page.waitForURL((url) => url.pathname === "/login");
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("[ROS-92][002:FR-025] cerrar sesión en una pestaña hace que la otra, en su siguiente acción, vaya al acceso", async ({
  context,
}) => {
  const first = await context.newPage();
  await login(first);
  const second = await context.newPage();
  await second.goto("/onboarding");
  expect(new URL(second.url()).pathname).toBe("/onboarding");

  await logout(first);

  await second.goto("/onboarding");
  await second.waitForURL((url) => url.pathname === "/login");
  expect((await second.request.get("/api/me")).status()).toBe(401);
});

import { expect, test, type Page, type Request } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * E2E de la historia 6 (T079): fallos de acceso con mensaje, salida y sin bucles (SC-007).
 * "Proveedor sin respuesta" se simula con server_error en /authorize (mismo código oauth_failed),
 * porque el proveedor simulado es compartido por toda la suite. La cuenta desactivada se cubre
 * en el backend (test_services, test_auth_tokens) y en las unitarias de /auth/denied.
 */
const run = Date.now();
const MAX_REDIRECTS = 6; // SC-007, aclarado el 2026-10-14

function trackRedirects(page: Page) {
  let longest = 0;
  page.on("request", (request: Request) => {
    if (!request.isNavigationRequest()) return;
    let hops = 0;
    for (let r = request.redirectedFrom(); r; r = r.redirectedFrom()) hops += 1;
    longest = Math.max(longest, hops);
  });
  return () => longest;
}

async function expectErrorScreen(page: Page, text: string) {
  await page.waitForURL((url) => url.pathname === "/auth/error");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(text);
  await expect(page.getByRole("link", { name: "Volver a intentar" })).toBeVisible();
}

test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-90][002:FR-036] cancelar el consentimiento muestra el mensaje con el proveedor y salida", async ({
  page,
}) => {
  const longest = trackRedirects(page);
  await mockIdp.cancelNextAuthorize();
  await page.goto("/login");

  await page.getByRole("link", { name: "Continuar con Google" }).click();

  await expectErrorScreen(page, "Cancelaste el inicio de sesión con Google.");
  expect(longest()).toBeLessThanOrEqual(MAX_REDIRECTS);
});

test("[ROS-90][002:FR-037] el proveedor falla: mensaje de proveedor sin respuesta", async ({
  page,
}) => {
  await mockIdp.failNextAuthorize();
  await page.goto("/login");

  await page.getByRole("link", { name: "Continuar con Microsoft" }).click();

  await expectErrorScreen(page, "Microsoft no respondió.");
});

test("[ROS-93][002:FR-004] la Acción deniega un correo no verificado", async ({ page }) => {
  await mockIdp.denyNextAuthorize("email_not_verified");
  await page.goto("/login");

  await page.getByRole("link", { name: "Continuar con Google" }).click();

  await expectErrorScreen(
    page,
    "Google no confirma que tu correo esté verificado. Verifícalo allí e inténtalo de nuevo.",
  );
});

test("[ROS-93][002:FR-004] el backend rechaza una credencial sin email_verified: /auth/denied → cierre → /auth/error", async ({
  page,
  context,
}) => {
  const longest = trackRedirects(page);
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-sin-verificar-${run}`,
    email: `sin-verificar-${run}@example.test`,
    name: "Sin Verificar",
    email_verified: false,
  });
  await page.goto("/login");

  await page.getByRole("link", { name: "Continuar con Google" }).click();

  await expectErrorScreen(
    page,
    "no confirma que tu correo esté verificado. Verifícalo allí e inténtalo de nuevo.",
  );
  expect((await context.cookies()).some((c) => c.name === "__session")).toBe(false);
  expect((await context.cookies()).some((c) => c.name === "rosetta_auth_error")).toBe(false);
  expect(longest()).toBeLessThanOrEqual(MAX_REDIRECTS);
});

test("[ROS-90][002:FR-009] correo ya registrado con otro proveedor: mensaje, sin sesión y sin bucle", async ({
  page,
  context,
}) => {
  const email = `compartido-${run}@example.test`;
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-a-${run}`,
    email,
    name: "A",
    email_verified: true,
  });
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/onboarding");
  await page.goto(`/auth/logout?returnTo=${encodeURIComponent("http://localhost:3100/login")}`);
  await page.waitForURL((url) => url.pathname === "/login");

  const longest = trackRedirects(page);
  await mockIdp.setIdentity({
    sub: `windowslive|e2e-b-${run}`,
    email,
    name: "B",
    email_verified: true,
  });
  await page.getByRole("link", { name: "Continuar con Microsoft" }).click();

  await expectErrorScreen(
    page,
    "Ya existe una cuenta con ese correo, creada con otro proveedor. Entra con el proveedor que usaste al registrarte.",
  );
  expect((await context.cookies()).some((c) => c.name === "__session")).toBe(false);
  expect(longest()).toBeLessThanOrEqual(MAX_REDIRECTS);

  await page.getByRole("link", { name: "Volver a intentar" }).click();
  await page.waitForURL((url) => url.pathname === "/login");
});

test("[ROS-90][002:FR-038] error inesperado: mensaje genérico con salida, nunca pantalla en blanco", async ({
  page,
}) => {
  await page.goto("/auth/error");

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
  );
  await expect(page.getByRole("link", { name: "Volver a intentar" })).toHaveAttribute(
    "href",
    "/login",
  );
});

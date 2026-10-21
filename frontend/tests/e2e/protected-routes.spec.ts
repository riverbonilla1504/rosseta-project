import { expect, test } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/** E2E de la historia 2 (T045): acceso solo para personas autenticadas. */
const run = Date.now();

test.beforeEach(async () => {
  await mockIdp.reset();
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-protegidas-${run}`,
    email: `protegidas-${run}@example.test`,
    name: "Persona Protegida",
    email_verified: true,
  });
});

test("[ROS-89][002:FR-014] enlace directo a una pantalla privada sin sesión → /login?returnTo= y, tras entrar, regreso a esa pantalla", async ({
  page,
}) => {
  await page.goto("/onboarding");
  await page.waitForURL((url) => url.pathname === "/login");
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe("/onboarding");

  await page.getByRole("link", { name: "Continuar con Google" }).click();

  await page.waitForURL(
    (url) => url.origin === "http://localhost:3100" && url.pathname === "/onboarding",
  );
});

test("[ROS-93][002:FR-015] un returnTo externo se ignora y se usa el destino por defecto", async ({
  page,
}) => {
  await page.goto(`/login?returnTo=${encodeURIComponent("https://evil.example/phish")}`);

  await page.getByRole("link", { name: "Continuar con Google" }).click();

  await page.waitForURL(
    (url) => url.origin === "http://localhost:3100" && url.pathname === "/onboarding",
  );
});

test("[ROS-89][002:FR-012] GET /api/me sin sesión → 401 (S2)", async ({ request }) => {
  const response = await request.get("/api/me");

  expect(response.status()).toBe(401);
  expect((await response.json()).error.code).toBe("session_expired");
});

test("[ROS-93][002:FR-031] POST /api/me/onboarding/complete con Origin ajeno → 403 (S4)", async ({
  request,
}) => {
  const response = await request.post("/api/me/onboarding/complete", {
    headers: { origin: "https://otro.example" },
  });

  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe("forbidden_origin");
});

test("[ROS-89][002:FR-012] /api/health responde sin sesión (S3)", async ({ request }) => {
  const response = await request.get("/api/health");

  expect([200, 503]).toContain(response.status());
});

import { expect, test } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/** E2E de la historia 5 (T066): el flujo de acceso resiste ataques comunes. */
const run = Date.now();
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/;

test.beforeEach(async () => {
  await mockIdp.reset();
  await mockIdp.setIdentity({
    sub: `google-oauth2|e2e-seguridad-${run}`,
    email: `seguridad-${run}@example.test`,
    name: "Persona Seguridad",
    email_verified: true,
  });
});

test("[ROS-93][002:FR-027] /auth/login lleva PKCE S256, state, audience y exactamente los scopes mínimos (S1, C10, FR-003)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Continuar con Google" }).click();
  await page.waitForURL((url) => url.pathname === "/onboarding");

  const authorize = (await mockIdp.state()).authorizeRequests.at(-1);
  expect(authorize?.code_challenge).toBeTruthy();
  expect(authorize?.code_challenge_method).toBe("S256");
  expect(authorize?.state).toBeTruthy();
  expect(authorize?.audience).toBe("https://api.rosetta.local");
  expect(authorize?.scope?.split(" ").sort()).toEqual([
    "email",
    "offline_access",
    "openid",
    "profile",
  ]);
});

test("[ROS-93][002:FR-028] una respuesta del proveedor con un state que no corresponde se rechaza y no crea sesión", async ({
  page,
  context,
}) => {
  await page.goto("/auth/callback?code=codigo-falso&state=state-falso");

  expect((await context.cookies()).some((c) => c.name === "__session")).toBe(false);
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("[ROS-93][002:FR-030] ninguna credencial aparece en almacenamiento, respuestas ni direcciones del navegador (SC-005, S8)", async ({
  page,
  context,
}) => {
  const seen: string[] = [];
  page.on("request", (request) => seen.push(request.url()));
  page.on("response", async (response) => {
    if (!response.url().startsWith("http://localhost:3100")) return;
    seen.push(response.url());
    seen.push(JSON.stringify(response.headers()));
    const type = response.headers()["content-type"] ?? "";
    if (type.includes("json") || type.includes("text")) {
      seen.push(await response.text().catch(() => ""));
    }
  });

  await page.goto("/login");
  await page.getByRole("link", { name: "Continuar con Google" }).click();
  await page.waitForURL((url) => url.pathname === "/onboarding");
  // Desde la propia página, como lo haría la interfaz: page.on("response") la intercepta.
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch("/api/me");
    return {
      headers: JSON.stringify([...response.headers.entries()]),
      body: await response.text(),
    };
  });
  seen.push(apiResponse.headers, apiResponse.body);

  const storage = await page.evaluate(() =>
    JSON.stringify({ ...window.localStorage, ...window.sessionStorage }),
  );
  const readableCookies = await page.evaluate(() => document.cookie);
  expect(storage).not.toMatch(JWT);
  expect(readableCookies).not.toMatch(JWT);
  expect(readableCookies).not.toContain("__session");
  for (const item of seen) expect(item).not.toMatch(JWT);
  const session = (await context.cookies()).find((c) => c.name === "__session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
});

test("[ROS-93][002:FR-034] /login lleva CSP con nonce, X-Frame-Options, nosniff y Referrer-Policy (S5)", async ({
  request,
}) => {
  const response = await request.get("/login");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toMatch(
    /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
  );
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("[ROS-93][002:FR-028] un destino de cierre de sesión fuera de la lista blanca se rechaza", async ({
  page,
}) => {
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/onboarding");

  await page.goto(`/auth/logout?returnTo=${encodeURIComponent("https://evil.example/")}`);

  await expect.poll(async () => (await mockIdp.state()).logouts.at(-1)?.accepted).toBe(false);
});

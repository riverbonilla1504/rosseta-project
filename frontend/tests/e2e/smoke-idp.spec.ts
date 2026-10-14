import { expect, test } from "@playwright/test";

import { mockIdp } from "./support/mock-idp";

/**
 * Prueba de humo del proveedor simulado (riesgos R-A y R-B de research.md, T032):
 * ida y vuelta completa del SDK contra el mock con allowInsecureRequests.
 */
test.beforeEach(async () => {
  await mockIdp.reset();
});

test("[ROS-93][002:FR-027] inicio, callback con PKCE, cookie __session y cierre de sesión con returnTo permitido", async ({
  page,
  context,
}) => {
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/");

  const authorize = (await mockIdp.state()).authorizeRequests.at(-1);
  expect(authorize?.code_challenge_method).toBe("S256");
  expect(authorize?.code_challenge).toBeTruthy();
  expect(authorize?.state).toBeTruthy();
  expect(authorize?.connection).toBe("google-oauth2");
  expect(authorize?.audience).toBe("https://api.rosetta.local");
  expect(authorize?.scope?.split(" ").sort()).toEqual(
    ["email", "offline_access", "openid", "profile"].sort(),
  );

  const session = (await context.cookies()).find((c) => c.name === "__session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");

  // returnTo absoluto: el SDK lo reenvía tal cual como post_logout_redirect_uri (research R-D).
  await page.goto(`/auth/logout?returnTo=${encodeURIComponent("http://localhost:3100/login")}`);
  await page.waitForURL((url) => url.pathname === "/login");

  expect((await mockIdp.state()).logouts.at(-1)).toEqual({
    target: "http://localhost:3100/login",
    accepted: true,
  });
  expect((await context.cookies()).some((c) => c.name === "__session")).toBe(false);
});

test("[ROS-93][002:FR-028] el proveedor simulado rechaza un cierre de sesión fuera de la lista blanca", async ({
  page,
}) => {
  await page.goto("/auth/login?connection=google-oauth2&returnTo=/");
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto("/auth/logout");

  await expect.poll(async () => (await mockIdp.state()).logouts.at(-1)?.accepted).toBe(false);
});

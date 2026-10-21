// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/auth/denied/route";

function call(query: string) {
  return GET(new Request(`http://localhost:3000/auth/denied${query}`));
}

describe("/auth/denied", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[ROS-90][002:FR-039] redirige al cierre de sesión con returnTo = URL absoluta de /auth/error", async () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    const response = await call("?code=account_disabled");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      `/auth/logout?returnTo=${encodeURIComponent("http://localhost:3000/auth/error")}`,
    );
  });

  it.each([
    "account_disabled",
    "account_exists_other_provider",
    "email_missing",
    "email_not_verified",
    "oauth_denied",
    "oauth_failed",
  ])("[ROS-90][002:FR-009] guarda %s en la cookie efímera", async (code) => {
    const cookie = (await call(`?code=${code}`)).headers.get("set-cookie") ?? "";

    expect(cookie).toContain(`rosetta_auth_error=${code}`);
  });

  it("[ROS-90][002:FR-011] otro valor se trata como oauth_failed", async () => {
    const cookie = (await call("?code=evil%3Cscript%3E")).headers.get("set-cookie") ?? "";

    expect(cookie).toContain("rosetta_auth_error=oauth_failed");
  });

  it("[ROS-90][002:FR-039] cookie HttpOnly, SameSite=Lax, Max-Age=60 y Secure solo en producción", async () => {
    const local = (await call("?code=account_disabled")).headers.get("set-cookie") ?? "";
    expect(local).toMatch(/HttpOnly/i);
    expect(local).toMatch(/SameSite=Lax/i);
    expect(local).toMatch(/Max-Age=60/);
    expect(local).not.toMatch(/Secure/i);

    vi.stubEnv("NODE_ENV", "production");
    const prod = (await call("?code=account_disabled")).headers.get("set-cookie") ?? "";
    expect(prod).toMatch(/Secure/i);
  });
});

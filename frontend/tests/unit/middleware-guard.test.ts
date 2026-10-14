// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkMiddleware = vi.fn();
const getSession = vi.fn();
const getAccessToken = vi.fn();
vi.mock("@/lib/auth0", () => ({
  auth0: { middleware: sdkMiddleware, getSession, getAccessToken },
}));

const { middleware } = await import("@/middleware");

const SESSION = { user: { sub: "google-oauth2|1" } };

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function location(response: Response) {
  const value = response.headers.get("location");
  return value ? new URL(value) : null;
}

describe("middleware: reglas de acceso (D1)", () => {
  beforeEach(() => {
    sdkMiddleware.mockReset().mockImplementation(async () => NextResponse.next());
    getSession.mockReset().mockResolvedValue(null);
    getAccessToken.mockReset().mockResolvedValue({ token: "t" });
  });

  it.each(["/projects", "/onboarding", "/p/123/sources"])(
    "[ROS-89][002:FR-014] sin sesión, %s → 302 a /login?returnTo=<ruta pedida>",
    async (path) => {
      const response = await middleware(request(path));

      expect(response.status).toBe(302);
      expect(location(response)?.pathname).toBe("/login");
      expect(location(response)?.searchParams.get("returnTo")).toBe(path);
    },
  );

  it("[ROS-89][002:FR-014] conserva la consulta de la ruta pedida en returnTo", async () => {
    const response = await middleware(request("/projects?archived=1"));

    expect(location(response)?.searchParams.get("returnTo")).toBe("/projects?archived=1");
  });

  it("[ROS-89][002:FR-014] la raíz sin sesión también va al acceso", async () => {
    const response = await middleware(request("/"));

    expect(location(response)?.pathname).toBe("/login");
  });

  it("[ROS-89][002:FR-014] con sesión, /login → /", async () => {
    getSession.mockResolvedValue(SESSION);

    const response = await middleware(request("/login"));

    expect(response.status).toBe(302);
    expect(location(response)?.pathname).toBe("/");
  });

  it.each([
    "/login",
    "/auth/login?connection=google-oauth2",
    "/auth/callback",
    "/auth/error",
    "/auth/denied?code=account_disabled",
    "/api/me",
    "/api/health",
  ])("[ROS-89][002:FR-012] %s no redirige sin sesión", async (path) => {
    const response = await middleware(request(path));

    expect(response.headers.get("location")).toBeNull();
  });

  it("[ROS-93][002:FR-015] el returnTo de una ruta privada siempre es interno", async () => {
    const response = await middleware(request("/%2F%2Fevil.example"));

    const returnTo = location(response)?.searchParams.get("returnTo") ?? "";
    expect(returnTo.startsWith("/")).toBe(true);
    expect(returnTo.startsWith("//")).toBe(false);
  });

  it("[ROS-89][002:FR-014] con sesión, una ruta privada pasa", async () => {
    getSession.mockResolvedValue(SESSION);

    const response = await middleware(request("/projects"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-security-policy")).toBeTruthy();
  });
});

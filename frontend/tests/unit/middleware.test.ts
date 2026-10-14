// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkMiddleware = vi.fn();
vi.mock("@/lib/auth0", () => ({ auth0: { middleware: sdkMiddleware } }));

const { middleware, config } = await import("@/middleware");

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function passThrough() {
  const response = NextResponse.next();
  response.cookies.set("__session", "rolled", { httpOnly: true });
  return response;
}

function directives(csp: string) {
  return Object.fromEntries(
    csp
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter((tokens) => tokens[0])
      .map(([name, ...values]) => [name, values]),
  );
}

describe("middleware: SDK de Auth0 y CSP con nonce", () => {
  beforeEach(() => {
    sdkMiddleware.mockReset();
    vi.unstubAllEnvs();
  });

  it("[ROS-93][002:FR-034] delega primero en el middleware del SDK", async () => {
    sdkMiddleware.mockResolvedValue(passThrough());
    const req = request("/auth/login");

    await middleware(req);

    expect(sdkMiddleware).toHaveBeenCalledWith(req);
  });

  it("[ROS-93][002:FR-034] la respuesta del SDK conserva sus cabeceras y recibe la CSP", async () => {
    const redirect = NextResponse.redirect("https://tenant.example.test/authorize");
    redirect.cookies.set("__txn_abc", "x", { httpOnly: true });
    sdkMiddleware.mockResolvedValue(redirect);

    const response = await middleware(request("/auth/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tenant.example.test/authorize");
    expect(response.headers.get("set-cookie")).toContain("__txn_abc");
    expect(response.headers.get("content-security-policy")).toContain("script-src");
  });

  it("[ROS-93][002:FR-034] en el paso normal conserva la cookie renovada del SDK", async () => {
    sdkMiddleware.mockResolvedValue(passThrough());

    const response = await middleware(request("/"));

    expect(response.headers.get("set-cookie")).toContain("__session=rolled");
    expect(response.headers.get("content-security-policy")).toBeTruthy();
  });

  it("[ROS-93][002:FR-034] el nonce es distinto en cada petición", async () => {
    sdkMiddleware.mockImplementation(async () => passThrough());

    const first = await middleware(request("/"));
    const second = await middleware(request("/"));
    const nonceOf = (r: Response) =>
      r.headers.get("content-security-policy")?.match(/'nonce-([^']+)'/)?.[1];

    expect(nonceOf(first)).toBeTruthy();
    expect(nonceOf(first)).not.toBe(nonceOf(second));
  });

  it("[ROS-93][002:FR-034] script-src con nonce y strict-dynamic, sin unsafe-inline ni unsafe-eval fuera de desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "production");
    sdkMiddleware.mockResolvedValue(passThrough());

    const csp = directives(
      (await middleware(request("/"))).headers.get("content-security-policy") ?? "",
    );

    expect(csp["script-src"][0]).toBe("'self'");
    expect(csp["script-src"][1]).toMatch(/^'nonce-[A-Za-z0-9+/=]+'$/);
    expect(csp["script-src"]).toContain("'strict-dynamic'");
    expect(csp["script-src"]).not.toContain("'unsafe-inline'");
    expect(csp["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("[ROS-93][002:FR-034] 'unsafe-eval' solo en desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "development");
    sdkMiddleware.mockResolvedValue(passThrough());

    const csp = directives(
      (await middleware(request("/"))).headers.get("content-security-policy") ?? "",
    );

    expect(csp["script-src"]).toContain("'unsafe-eval'");
  });

  it("[ROS-93][002:FR-034] el resto de directivas son las de 07-seguridad §5", async () => {
    sdkMiddleware.mockResolvedValue(passThrough());

    const csp = directives(
      (await middleware(request("/"))).headers.get("content-security-policy") ?? "",
    );

    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["img-src"]).toEqual([
      "'self'",
      "data:",
      "https://lh3.googleusercontent.com",
      "https://s.gravatar.com",
      "https://*.auth0.com",
    ]);
    expect(csp["style-src"]).toEqual(["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]);
    expect(csp["font-src"]).toEqual(["'self'", "https://fonts.gstatic.com"]);
    expect(csp["connect-src"]).toEqual(["'self'"]);
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
    expect(csp["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("[ROS-93][002:FR-034] el matcher excluye los estáticos", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    expect(matcher.test("/_next/static/chunk.js")).toBe(false);
    expect(matcher.test("/_next/image")).toBe(false);
    expect(matcher.test("/favicon.ico")).toBe(false);
    expect(matcher.test("/login")).toBe(true);
    expect(matcher.test("/auth/callback")).toBe(true);
  });
});

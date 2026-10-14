// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkMiddleware = vi.fn();
const getSession = vi.fn();
const getAccessToken = vi.fn();
vi.mock("@/lib/auth0", () => ({
  auth0: { middleware: sdkMiddleware, getSession, getAccessToken },
}));

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
    getSession.mockReset().mockResolvedValue(null);
    getAccessToken.mockReset();
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
    getSession.mockResolvedValue({ user: { sub: "google-oauth2|1" } }); // con sesión: pasa (T047)
    getAccessToken.mockResolvedValue({ token: "t" });

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

  describe("renovación de la credencial en el middleware (FR-022)", () => {
    const refreshed = async (_req: NextRequest, res: NextResponse) => {
      res.cookies.set("__session", "refreshed", { httpOnly: true });
      return { token: "new-access-token" };
    };

    it("[ROS-92][002:FR-022] con sesión renueva la credencial, la guarda en la respuesta y la pasa a la petición", async () => {
      sdkMiddleware.mockResolvedValue(passThrough());
      getSession.mockResolvedValue({ user: { sub: "google-oauth2|1" } });
      getAccessToken.mockImplementation(refreshed);

      const response = await middleware(request("/onboarding"));

      expect(getAccessToken).toHaveBeenCalledTimes(1);
      expect(response.headers.get("set-cookie")).toContain("__session=refreshed");
      expect(response.headers.get("x-middleware-request-cookie")).toContain("__session=refreshed");
    });

    it("[ROS-92][002:FR-022] también antes del proxy /api, para que el route handler no renueve otra vez", async () => {
      sdkMiddleware.mockResolvedValue(passThrough());
      getSession.mockResolvedValue({ user: { sub: "google-oauth2|1" } });
      getAccessToken.mockImplementation(refreshed);

      await middleware(request("/api/me"));

      expect(getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("[ROS-92][002:FR-022] no renueva en las rutas del SDK ni sin sesión", async () => {
      sdkMiddleware.mockImplementation(async () => passThrough());

      await middleware(request("/auth/callback"));
      getSession.mockResolvedValue(null);
      await middleware(request("/projects"));

      expect(getAccessToken).not.toHaveBeenCalled();
    });

    it("[ROS-92][002:FR-026] si la renovación falla no rompe la petición (la ruta decide 401 o 503)", async () => {
      sdkMiddleware.mockResolvedValue(passThrough());
      getSession.mockResolvedValue({ user: { sub: "google-oauth2|1" } });
      getAccessToken.mockRejectedValue(new Error("failed_to_refresh_token"));

      const response = await middleware(request("/projects"));

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });
});

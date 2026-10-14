// @vitest-environment node
import { AccessTokenError, AccessTokenErrorCode, OAuth2Error } from "@auth0/nextjs-auth0/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProxyAuthError, classifyTokenError, createProxyHandler } from "@/lib/api/proxy";

const APP = "http://localhost:3000";
const BACKEND = "http://backend.internal:8000";

let getAccessToken: ReturnType<typeof vi.fn>;
let fetchImpl: ReturnType<typeof vi.fn>;

function handler() {
  return createProxyHandler({
    appBaseUrl: APP,
    backendUrl: BACKEND,
    getAccessToken,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    log: () => {},
  });
}

function req(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  return new Request(`${APP}${path}`, init);
}

function backendResponse(body = { ok: true }, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
}

function forwarded() {
  const [url, init] = fetchImpl.mock.calls[0];
  return { url: String(url), init: init as RequestInit, headers: new Headers(init.headers) };
}

async function errorCode(response: Response) {
  return (await response.json()).error.code;
}

describe("proxy BFF /api/*", () => {
  beforeEach(() => {
    getAccessToken = vi.fn().mockResolvedValue("access-token-123");
    fetchImpl = vi.fn().mockResolvedValue(backendResponse());
  });

  it("[ROS-92][002:FR-030] añade Authorization: Bearer, conserva la consulta y no devuelve la credencial", async () => {
    const response = await handler()(req("/api/me?x=1"));

    expect(forwarded().url).toBe(`${BACKEND}/api/me?x=1`);
    expect(forwarded().headers.get("authorization")).toBe("Bearer access-token-123");
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("access-token-123");
    expect([...response.headers.values()].join(" ")).not.toContain("access-token-123");
  });

  it("[ROS-92][002:FR-030] descarta cookie y authorization entrantes y reenvía solo la lista cerrada", async () => {
    await handler()(
      req("/api/me", {
        headers: {
          cookie: "__session=abc",
          authorization: "Bearer del-navegador",
          accept: "application/json",
          "accept-language": "es",
          "x-request-id": "rid-1",
          referer: "http://localhost:3000/projects",
          "x-forwarded-for": "1.2.3.4",
        },
      }),
    );

    const { headers } = forwarded();
    expect(headers.get("cookie")).toBeNull();
    expect(headers.get("authorization")).toBe("Bearer access-token-123");
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("accept-language")).toBe("es");
    expect(headers.get("x-request-id")).toBe("rid-1");
    expect(headers.get("referer")).toBeNull();
    expect(headers.get("x-forwarded-for")).toBeNull();
  });

  it("[ROS-92][002:FR-030] genera x-request-id si falta", async () => {
    await handler()(req("/api/me"));

    expect(forwarded().headers.get("x-request-id")).toMatch(/.+/);
  });

  it("[ROS-92][002:FR-030] descarta set-cookie del backend y devuelve solo cabeceras permitidas", async () => {
    fetchImpl.mockResolvedValue(
      backendResponse(
        { ok: true },
        {
          headers: {
            "set-cookie": "tracking=1",
            etag: '"v1"',
            "x-request-id": "rid-2",
            server: "gunicorn",
          },
        },
      ),
    );

    const response = await handler()(req("/api/me"));

    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("server")).toBeNull();
    expect(response.headers.get("etag")).toBe('"v1"');
    expect(response.headers.get("x-request-id")).toBe("rid-2");
    expect(response.headers.get("content-type")).toBe("application/json");
  });

  it("[ROS-92][002:FR-030] Cache-Control: no-store por defecto y respeta el del backend", async () => {
    expect((await handler()(req("/api/me"))).headers.get("cache-control")).toBe("no-store");

    fetchImpl.mockResolvedValue(
      backendResponse({}, { headers: { "cache-control": "max-age=60" } }),
    );
    expect((await handler()(req("/api/me"))).headers.get("cache-control")).toBe("max-age=60");
  });

  it.each(["OPTIONS", "HEAD", "TRACE"])("[ROS-89][002:FR-012] método %s → 405", async (method) => {
    const response = await handler()(req("/api/me", { method }));

    expect(response.status).toBe(405);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each(["/api//me", "/api/me%2Fadmin", "/api/me%2fadmin", "/api/me%5Cx", "/api/", "/api"])(
    "[ROS-89][002:FR-012] ruta mal formada %s → 400 validation_error",
    async (path) => {
      const response = await handler()(req(path));

      expect(response.status).toBe(400);
      expect(await errorCode(response)).toBe("validation_error");
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "[ROS-93][002:FR-031] %s con Origin ajeno → 403 forbidden_origin sin pedir credencial",
    async (method) => {
      const response = await handler()(
        req("/api/me/onboarding/complete", { method, headers: { origin: "https://otro.example" } }),
      );

      expect(response.status).toBe(403);
      expect(await errorCode(response)).toBe("forbidden_origin");
      expect(getAccessToken).not.toHaveBeenCalled();
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it("[ROS-93][002:FR-031] mutación sin Origin ni Sec-Fetch-Site: same-origin → 403", async () => {
    const response = await handler()(req("/api/me/onboarding/complete", { method: "POST" }));

    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe("forbidden_origin");
  });

  it("[ROS-93][002:FR-031] mutación sin Origin pero con Sec-Fetch-Site: same-origin pasa", async () => {
    const response = await handler()(
      req("/api/me/onboarding/complete", {
        method: "POST",
        headers: { "sec-fetch-site": "same-origin" },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("[ROS-93][002:FR-031] la comprobación de origen va antes que la de sesión", async () => {
    getAccessToken.mockRejectedValue(new ProxyAuthError("session_expired"));

    const response = await handler()(
      req("/api/me/onboarding/complete", {
        method: "POST",
        headers: { origin: "https://otro.example" },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("[ROS-92][002:FR-022] reenvía el cuerpo en streaming", async () => {
    await handler()(
      req("/api/projects", {
        method: "POST",
        headers: { origin: APP, "content-type": "application/json" },
        body: JSON.stringify({ name: "p" }),
      }),
    );

    const { init, headers } = forwarded();
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(ReadableStream);
    expect((init as { duplex?: string }).duplex).toBe("half");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it.each(["/api/health", "/api/schema/"])(
    "[ROS-89][002:FR-012] %s pasa sin credencial",
    async (path) => {
      const response = await handler()(req(path));

      expect(response.status).toBe(200);
      expect(getAccessToken).not.toHaveBeenCalled();
      expect(forwarded().headers.get("authorization")).toBeNull();
    },
  );

  it("[ROS-92][002:FR-026] sin sesión → 401 session_expired", async () => {
    getAccessToken.mockRejectedValue(new ProxyAuthError("session_expired"));

    const response = await handler()(req("/api/me"));

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("session_expired");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("[ROS-93][002:FR-031] el servicio de identidad no responde → 503 identity_unavailable sin tocar la sesión", async () => {
    getAccessToken.mockRejectedValue(new ProxyAuthError("identity_unavailable"));

    const response = await handler()(req("/api/me"));

    expect(response.status).toBe(503);
    expect(await errorCode(response)).toBe("identity_unavailable");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("[ROS-89][002:FR-013] backend caído → 502 backend_unavailable con el formato estándar", async () => {
    fetchImpl.mockRejectedValue(new TypeError("fetch failed"));

    const response = await handler()(req("/api/me"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(Object.keys(body.error).sort()).toEqual(["code", "details", "message"]);
    expect(body.error.code).toBe("backend_unavailable");
  });

  it("[ROS-89][002:FR-013] el 403 de cuenta rechazada del backend se devuelve con su mismo código", async () => {
    fetchImpl.mockResolvedValue(
      backendResponse(
        { error: { code: "account_disabled", message: "x", details: {} } },
        { status: 403 },
      ),
    );

    const response = await handler()(req("/api/me"));

    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe("account_disabled");
  });
});

describe("clasificación de los errores de credencial del SDK", () => {
  it("[ROS-92][002:FR-026] sin sesión o renovación rechazada → session_expired", () => {
    expect(
      classifyTokenError(new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "x")).code,
    ).toBe("session_expired");
    expect(
      classifyTokenError(
        new AccessTokenError(
          AccessTokenErrorCode.FAILED_TO_REFRESH_TOKEN,
          "x",
          new OAuth2Error({ code: "invalid_grant", message: "reused" }),
        ),
      ).code,
    ).toBe("session_expired");
  });

  it("[ROS-93][002:FR-031] fallo de red al renovar → identity_unavailable", () => {
    expect(
      classifyTokenError(
        new AccessTokenError(
          AccessTokenErrorCode.FAILED_TO_REFRESH_TOKEN,
          "x",
          new OAuth2Error({ code: "unknown_error", message: "fetch failed" }),
        ),
      ).code,
    ).toBe("identity_unavailable");
    expect(classifyTokenError(new TypeError("fetch failed")).code).toBe("identity_unavailable");
  });
});

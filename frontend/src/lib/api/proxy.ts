import { AccessTokenError } from "@auth0/nextjs-auth0/errors";

/**
 * Proxy BFF /api/* (contracts/bff-proxy.md, research R-08).
 * Implementa FR-012, FR-013 (ROS-89), FR-022, FR-026, FR-030 (ROS-92) y FR-031 (ROS-93):
 * el navegador nunca ve credenciales; el access token se obtiene en el servidor.
 * Núcleo sin dependencias de Next para poder probarlo; route.ts lo conecta con el SDK.
 */

export type ProxyErrorCode =
  | "session_expired"
  | "identity_unavailable"
  | "forbidden_origin"
  | "validation_error"
  | "method_not_allowed"
  | "backend_unavailable";

export class ProxyAuthError extends Error {
  constructor(readonly code: "session_expired" | "identity_unavailable") {
    super(code);
    this.name = "ProxyAuthError";
  }
}

export type ProxyLogEntry = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  requestId: string;
};

export type ProxyDeps = {
  appBaseUrl: string;
  backendUrl: string;
  getAccessToken: () => Promise<string>;
  fetchImpl?: typeof fetch;
  log?: (entry: ProxyLogEntry) => void;
  timeoutMs?: number;
};

const METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);
const MUTATIONS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const PUBLIC_PATHS = new Set(["/api/health", "/api/schema/"]);
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  // Con el cuerpo en streaming y sin content-length, fetch lo envía chunked y Django (WSGI)
  // lo lee vacío (EC-026).
  "content-length",
  "content-type",
  "if-none-match",
  "x-request-id",
];
const RETURNED_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "etag",
  "x-request-id",
  "cache-control",
];
const DEFAULT_TIMEOUT_MS = 30_000; // valor técnico provisional (bff-proxy.md)

const MESSAGES: Record<ProxyErrorCode, string> = {
  session_expired: "Tu sesión terminó. Vuelve a iniciar sesión para continuar.",
  identity_unavailable: "El servicio de identidad no respondió. Intenta de nuevo.",
  forbidden_origin: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
  validation_error: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
  method_not_allowed: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
  backend_unavailable: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
};

function errorResponse(status: number, code: ProxyErrorCode): Response {
  return Response.json(
    { error: { code, message: MESSAGES[code], details: {} } },
    { status, headers: { "cache-control": "no-store" } },
  );
}

/** Solo /api/<segmentos> sin vacíos, ".", ".." ni barras codificadas (no se sale de /api). */
function isSafeApiPath(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  let rest = pathname.slice("/api/".length);
  if (rest.endsWith("/")) rest = rest.slice(0, -1);
  if (rest === "") return false;
  return rest.split("/").every((segment) => {
    if (segment === "" || segment === "." || segment === "..") return false;
    if (/%2f|%5c/i.test(segment)) return false;
    try {
      const decoded = decodeURIComponent(segment);
      return decoded !== "." && decoded !== ".." && !/[/\\]/.test(decoded);
    } catch {
      return false;
    }
  });
}

function hasTrustedOrigin(request: Request, appOrigin: string): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === appOrigin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

/** Traduce un error del SDK al obtener la credencial (sesión vencida o proveedor caído). */
export function classifyTokenError(error: unknown): ProxyAuthError {
  if (error instanceof ProxyAuthError) return error;
  if (error instanceof AccessTokenError) {
    if (error.code === "failed_to_refresh_token") {
      const causeCode = (error.cause as { code?: string } | undefined)?.code;
      return new ProxyAuthError(
        causeCode && causeCode !== "unknown_error" ? "session_expired" : "identity_unavailable",
      );
    }
    return new ProxyAuthError("session_expired");
  }
  return new ProxyAuthError("identity_unavailable");
}

export function createProxyHandler(deps: ProxyDeps) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const appOrigin = new URL(deps.appBaseUrl).origin;
  const backendBase = deps.backendUrl.replace(/\/+$/, "");
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async function proxy(request: Request): Promise<Response> {
    const started = Date.now();
    const url = new URL(request.url);
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    const method = request.method.toUpperCase();

    const response = await handle();
    deps.log?.({
      method,
      path: url.pathname,
      status: response.status,
      durationMs: Date.now() - started,
      requestId,
    });
    return response;

    async function handle(): Promise<Response> {
      // Orden fijo: método → ruta → origen → sesión (bff-proxy.md).
      if (!METHODS.has(method)) return errorResponse(405, "method_not_allowed");
      if (!isSafeApiPath(url.pathname)) return errorResponse(400, "validation_error");
      if (MUTATIONS.has(method) && !hasTrustedOrigin(request, appOrigin)) {
        return errorResponse(403, "forbidden_origin");
      }

      const isPublic = method === "GET" && PUBLIC_PATHS.has(url.pathname);
      const headers = new Headers();
      for (const name of FORWARDED_REQUEST_HEADERS) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
      }
      headers.set("x-request-id", requestId);

      if (!isPublic) {
        try {
          headers.set("authorization", `Bearer ${await deps.getAccessToken()}`);
        } catch (error) {
          const { code } = classifyTokenError(error);
          return errorResponse(code === "session_expired" ? 401 : 503, code);
        }
      }

      let upstream: Response;
      try {
        upstream = await fetchImpl(`${backendBase}${url.pathname}${url.search}`, {
          method,
          headers,
          body: MUTATIONS.has(method) ? request.body : undefined,
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
          ...(MUTATIONS.has(method) ? { duplex: "half" } : {}),
        } as RequestInit);
      } catch {
        return errorResponse(502, "backend_unavailable");
      }

      const responseHeaders = new Headers();
      for (const name of RETURNED_RESPONSE_HEADERS) {
        const value = upstream.headers.get(name);
        if (value) responseHeaders.set(name, value);
      }
      if (!isPublic && !responseHeaders.has("cache-control")) {
        responseHeaders.set("cache-control", "no-store");
      }
      return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
    }
  };
}

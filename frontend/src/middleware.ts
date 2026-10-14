import { NextResponse, type NextRequest } from "next/server";

import { normalizeErrorCode } from "@/features/auth/errorCodes";
import { safeReturnTo } from "@/features/auth/safeReturnTo";
import { auth0 } from "@/lib/auth0";
import { buildCsp, createNonce } from "@/lib/security/csp";

/**
 * 1. El middleware del SDK monta /auth/login, /auth/logout y /auth/callback y renueva la
 *    sesión (ADR-0007, ROS-183).
 * 2. Reglas de acceso (D1, FR-012, FR-014; ROS-181): sin sesión, toda ruta privada va a
 *    /login?returnTo=<ruta pedida>; con sesión, /login va a la raíz. Públicas: /login, /auth/*
 *    y /api/* (el proxy aplica su propia regla).
 * 3. Toda respuesta lleva la CSP con un nonce nuevo (FR-034, ROS-190). En el paso normal el
 *    nonce viaja también en las cabeceras de la petición para que Next lo aplique.
 */
const REDIRECT_STATUS = 302;
const AUTH_ERROR_COOKIE = "rosetta_auth_error";

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/auth/") || pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  const { pathname, search } = request.nextUrl;

  const authResponse = await auth0.middleware(request);
  if (authResponse.headers.get("x-middleware-next") !== "1") {
    // Rutas del SDK (/auth/login, /auth/callback, /auth/logout): su respuesta tal cual.
    authResponse.headers.set("content-security-policy", csp);
    return authResponse;
  }

  const session = pathname.startsWith("/auth/") ? null : await auth0.getSession(request);

  if (!session && !isPublicPath(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", safeReturnTo(`${pathname}${search}`));
    return withCsp(NextResponse.redirect(login, REDIRECT_STATUS), csp);
  }
  if (session && pathname === "/login") {
    return withCsp(NextResponse.redirect(new URL("/", request.url), REDIRECT_STATUS), csp);
  }

  const refreshedCookies = session ? await refreshAccessToken(request) : [];
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  // Ruta actual para el layout del área privada (la sobrescribe siempre: no se fía del cliente).
  requestHeaders.set("x-rosetta-pathname", pathname);
  // Código de /auth/denied (cookie efímera): solo lo pone el middleware y se borra al leerlo.
  requestHeaders.delete("x-rosetta-auth-error");
  const authError = pathname === "/auth/error" ? request.cookies.get(AUTH_ERROR_COOKIE) : undefined;
  if (authError) requestHeaders.set("x-rosetta-auth-error", normalizeErrorCode(authError.value));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (authError) response.cookies.delete(AUTH_ERROR_COOKIE);
  authResponse.headers.forEach((value, key) => {
    if (key.startsWith("x-middleware-") || key === "set-cookie") return;
    response.headers.set(key, value);
  });
  for (const cookie of [...authResponse.headers.getSetCookie(), ...refreshedCookies]) {
    response.headers.append("set-cookie", cookie);
  }
  return withCsp(response, csp);
}

function withCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set("content-security-policy", csp);
  return response;
}

/**
 * Renueva el access token aquí y no en un componente de servidor (FR-022): allí el SDK no puede
 * guardar la sesión renovada y, con la rotación de refresh tokens, la siguiente renovación
 * reutilizaría el refresh token viejo y el tenant cerraría la sesión. La sesión renovada se
 * guarda en la respuesta y se pasa a la petición, para que páginas y proxy ya la vean fresca.
 * Si falla, la ruta decide (401 o 503); el middleware no corta la petición.
 */
async function refreshAccessToken(request: NextRequest): Promise<string[]> {
  const scratch = NextResponse.next();
  try {
    await auth0.getAccessToken(request, scratch);
  } catch {
    return [];
  }
  for (const cookie of scratch.cookies.getAll()) {
    if (cookie.value === "" || cookie.maxAge === 0) request.cookies.delete(cookie.name);
    else request.cookies.set(cookie.name, cookie.value);
  }
  return scratch.headers.getSetCookie();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};

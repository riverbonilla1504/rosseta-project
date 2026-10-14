import { NextResponse, type NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";
import { buildCsp, createNonce } from "@/lib/security/csp";

/**
 * 1. El middleware del SDK monta /auth/login, /auth/logout y /auth/callback y renueva la
 *    sesión (ADR-0007, ROS-183).
 * 2. Toda respuesta lleva la CSP con un nonce nuevo (FR-034, ROS-190). En el paso normal el
 *    nonce viaja también en las cabeceras de la petición para que Next lo aplique.
 * Las reglas de acceso (sin sesión → /login?returnTo=) llegan en T047.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const authResponse = await auth0.middleware(request);
  let response = authResponse;

  if (authResponse.headers.get("x-middleware-next") === "1") {
    const refreshedCookies = await refreshAccessToken(request);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("content-security-policy", csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
    authResponse.headers.forEach((value, key) => {
      if (key.startsWith("x-middleware-") || key === "set-cookie") return;
      response.headers.set(key, value);
    });
    for (const cookie of [...authResponse.headers.getSetCookie(), ...refreshedCookies]) {
      response.headers.append("set-cookie", cookie);
    }
  }

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
  if (request.nextUrl.pathname.startsWith("/auth/")) return [];
  if (!(await auth0.getSession(request))) return [];

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

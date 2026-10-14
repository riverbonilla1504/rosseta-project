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
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("content-security-policy", csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
    authResponse.headers.forEach((value, key) => {
      if (key.startsWith("x-middleware-") || key === "set-cookie") return;
      response.headers.set(key, value);
    });
    for (const cookie of authResponse.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }
  }

  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};

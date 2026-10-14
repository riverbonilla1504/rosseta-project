import { normalizeErrorCode } from "@/features/auth/errorCodes";

/**
 * /auth/denied (contracts/auth-flow.md §5; FR-009, FR-011, FR-039). El backend rechazó la
 * cuenta pero el SDK ya tiene sesión: guardar el código en una cookie efímera y cerrar la
 * sesión hacia /auth/error, para que /login → / → 403 no forme un bucle. El returnTo es la URL
 * absoluta de /auth/error (lista blanca del tenant, research R-D).
 */
export const dynamic = "force-dynamic";

const ERROR_COOKIE = "rosetta_auth_error";
const ERROR_COOKIE_MAX_AGE = 60;

export async function GET(request: Request): Promise<Response> {
  const code = normalizeErrorCode(new URL(request.url).searchParams.get("code"));
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return new Response(null, {
    status: 302,
    headers: {
      location: `/auth/logout?returnTo=${encodeURIComponent(`${base}/auth/error`)}`,
      "set-cookie": `${ERROR_COOKIE}=${code}; Max-Age=${ERROR_COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secure}`,
      "cache-control": "no-store",
    },
  });
}

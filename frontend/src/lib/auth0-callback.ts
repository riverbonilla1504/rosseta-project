import type { AuthErrorCode } from "@/features/auth/errorCodes";
import { DEFAULT_RETURN_TO, safeReturnTo } from "@/features/auth/safeReturnTo";

/**
 * Destino tras el callback del SDK (research R-07 y R-B). Implementa FR-036 y FR-037 (ROS-90),
 * FR-004 y FR-015 (ROS-93). El SDK entrega los errores como AuthorizationError con
 * cause = OAuth2Error{ code, message }: cancelar y la denegación de la Acción llegan como
 * access_denied, y la Acción pone su motivo en el mensaje.
 */
const ACTION_REASONS: AuthErrorCode[] = ["email_not_verified", "email_missing"];

type CauseLike = { code?: string; message?: string };

function errorCode(error: Error): AuthErrorCode {
  const cause = (error as { cause?: CauseLike }).cause;
  if (error.name === "AuthorizationError" && cause?.code === "access_denied") {
    const reason = ACTION_REASONS.find((code) => code === cause.message);
    return reason ?? "oauth_denied";
  }
  return "oauth_failed";
}

export function callbackRedirect(
  error: Error | null,
  ctx: { returnTo?: string },
  appBaseUrl: string,
): string {
  const returnTo = safeReturnTo(ctx.returnTo);
  if (!error) return new URL(returnTo, appBaseUrl).toString();

  const target = new URL("/auth/error", appBaseUrl);
  target.searchParams.set("code", errorCode(error));
  if (returnTo !== DEFAULT_RETURN_TO) target.searchParams.set("returnTo", returnTo);
  return target.toString();
}

type MeResult =
  | { status: "ok"; user: { onboarding_completed: boolean } }
  | { status: "unauthenticated" }
  | { status: "denied"; code: string };

/**
 * Como callbackRedirect, pero con éxito y sin returnTo propio resuelve aquí el destino con la
 * credencial recién obtenida: /onboarding, /projects o /auth/denied, sin pasar por la raíz.
 * Ahorra un salto: la cadena de una cuenta rechazada queda en 6 (SC-007).
 */
export async function callbackDestination(
  error: Error | null,
  ctx: { returnTo?: string },
  accessToken: string | undefined,
  deps: { appBaseUrl: string; fetchMe: (token: string) => Promise<MeResult> },
): Promise<string> {
  if (error || !accessToken || safeReturnTo(ctx.returnTo) !== DEFAULT_RETURN_TO) {
    return callbackRedirect(error, ctx, deps.appBaseUrl);
  }
  try {
    const result = await deps.fetchMe(accessToken);
    if (result.status === "denied") {
      return new URL(`/auth/denied?code=${result.code}`, deps.appBaseUrl).toString();
    }
    if (result.status === "ok") {
      const path = result.user.onboarding_completed ? "/projects" : "/onboarding";
      return new URL(path, deps.appBaseUrl).toString();
    }
  } catch {
    // Sin respuesta del backend: la raíz resuelve el destino en la siguiente petición.
  }
  return callbackRedirect(null, ctx, deps.appBaseUrl);
}

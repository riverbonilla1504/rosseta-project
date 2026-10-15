import type { Auth0ClientOptions } from "@auth0/nextjs-auth0/types";

/**
 * Opciones del SDK de Auth0 (research R-05, contracts/auth-flow.md §4).
 * Implementa FR-024 (ROS-92), FR-027 y FR-030 (ROS-93). Función pura para poder probarla.
 */
type Env = Readonly<Record<string, string | undefined>>;

// 14 días sin uso y 30 días de máximo (DP-022), alineados con el refresh token del tenant.
const INACTIVITY_SECONDS = 14 * 24 * 60 * 60;
const ABSOLUTE_SECONDS = 30 * 24 * 60 * 60;
// Una solicitud de acceso iniciada vale 10 minutos (por defecto el SDK usa 1 h).
const TRANSACTION_MAX_AGE_SECONDS = 600;
const SCOPE = "openid profile email offline_access";

export function buildAuth0Options(env: Env = process.env): Auth0ClientOptions {
  const isProduction = env.NODE_ENV === "production";
  const secure = isProduction || (env.APP_BASE_URL ?? "").startsWith("https://");

  return {
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    secret: env.AUTH0_SECRET,
    appBaseUrl: env.APP_BASE_URL,
    authorizationParameters: { scope: SCOPE, audience: env.AUTH0_AUDIENCE },
    signInReturnToPath: "/",
    session: {
      rolling: true,
      inactivityDuration: INACTIVITY_SECONDS,
      absoluteDuration: ABSOLUTE_SECONDS,
      cookie: { sameSite: "lax", secure },
    },
    transactionCookie: { sameSite: "lax", secure, maxAge: TRANSACTION_MAX_AGE_SECONDS },
    // El navegador nunca ve credenciales: el proxy BFF obtiene el token en el servidor (FR-030).
    enableAccessTokenEndpoint: false,
    // Solo E2E contra el proveedor simulado; el SDK además lo prohíbe en producción.
    allowInsecureRequests: !isProduction && env.E2E_ALLOW_INSECURE_IDP === "1",
  };
}

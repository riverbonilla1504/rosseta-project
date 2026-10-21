import { classifyTokenError } from "@/lib/api/proxy";
import { auth0 } from "@/lib/auth0";

import { fetchMe, type CurrentUserResult } from "./fetchMe";

export type { AccountRejectionCode, CurrentUserResult, Me } from "./fetchMe";
export { ACCOUNT_REJECTION_CODES } from "./fetchMe";

/**
 * Cuenta actual para componentes de servidor (ROS-186): consulta GET /api/me al backend con la
 * credencial del SDK. La credencial la renueva antes el middleware; aquí solo se lee (FR-022).
 */
export async function getCurrentUser(): Promise<CurrentUserResult> {
  let token: string;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (error) {
    if (classifyTokenError(error).code === "session_expired") return { status: "unauthenticated" };
    throw error;
  }
  return fetchMe(token);
}

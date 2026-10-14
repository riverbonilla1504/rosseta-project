import { copy, PROVIDER_NAMES, type Provider } from "./copy";

/**
 * Códigos de error de acceso que entiende /auth/error (contracts/auth-flow.md §5).
 * account_disabled, email_missing y email_not_verified son PROVISIONALES hasta DP-025.
 * Implementa FR-036 a FR-039 (ROS-90).
 */
export const AUTH_ERROR_CODES = [
  "oauth_denied",
  "oauth_failed",
  "email_not_verified",
  "email_missing",
  "account_exists_other_provider",
  "account_disabled",
] as const;
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

/** Cualquier valor fuera de la lista cerrada se trata como oauth_failed. */
export function normalizeErrorCode(value: unknown): AuthErrorCode {
  return AUTH_ERROR_CODES.includes(value as AuthErrorCode)
    ? (value as AuthErrorCode)
    : "oauth_failed";
}

export function providerFromCookie(value: string | undefined): Provider | null {
  return value === "google" || value === "microsoft" ? value : null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Mensaje de la pantalla de error. Sin código → error genérico (FR-038). {proveedor} sale de
 * la cookie rosetta_login_provider; sin ella, la forma genérica (DP-025).
 */
export function errorMessage(code: AuthErrorCode | null, provider: Provider | null): string {
  if (code === null) return copy.errors.generic;
  const name = provider ? PROVIDER_NAMES[provider] : copy.genericProvider;
  const text = copy.errors[code].replaceAll("{proveedor}", name);
  return capitalize(text);
}

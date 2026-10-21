/**
 * Cliente mínimo del navegador hacia /api/* (mismo origen, proxy BFF). ROS-188.
 * Implementa FR-026 (ROS-92): ante 401 lleva al acceso con el aviso de sesión vencida y el
 * regreso a la pantalla actual; ante 503 el error es recuperable y la sesión no se toca.
 * Nunca reintenta solo: una operación interrumpida no se aplica a medias.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

type Options = { navigate?: (url: string) => void };

const ACCOUNT_REJECTION_CODES = [
  "account_disabled",
  "account_exists_other_provider",
  "email_missing",
  "email_not_verified",
] as const;

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  { navigate = (url) => window.location.assign(url) }: Options = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { accept: "application/json", ...init.headers },
  });

  if (response.ok) return (await response.json()) as T;

  const code: string =
    (await response.json().catch(() => null))?.error?.code ?? `http_${response.status}`;

  if (response.status === 401) {
    const params = new URLSearchParams({ returnTo: currentPath(), notice: "session_expired" });
    navigate(`/login?${params.toString()}`);
    throw new ApiError(401, code, false);
  }
  if (response.status === 403 && (ACCOUNT_REJECTION_CODES as readonly string[]).includes(code)) {
    // Cuenta rechazada: /auth/denied cierra la sesión y lleva a /auth/error, sin bucle (FR-039).
    navigate(`/auth/denied?code=${code}`);
    throw new ApiError(403, code, false);
  }
  throw new ApiError(response.status, code, response.status === 503);
}

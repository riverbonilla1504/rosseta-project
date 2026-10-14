/**
 * Control del proveedor de identidad simulado desde las pruebas E2E (research R-13, T032).
 * Solo identidades sintéticas con dominio example.test (RNF-38).
 */
export const MOCK_IDP_URL = "http://localhost:4010";

export type MockIdentity = {
  sub: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  email_verified?: boolean | null;
};

async function control(path: string, body?: unknown) {
  const response = await fetch(`${MOCK_IDP_URL}/__control/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`mock-idp ${path}: ${response.status}`);
  return response.json();
}

export const mockIdp = {
  reset: () => control("reset", {}),
  setIdentity: (identity: MockIdentity) => control("identity", identity),
  setAccessTokenTtl: (seconds: number) => control("token-ttl", { seconds }),
  /** El canje del refresh token responde invalid_grant (revocado o reutilizado). */
  rejectRefresh: (reject = true) => control("reject-refresh", { reject }),
  /** Cancelación del consentimiento: error=access_denied sin descripción de la Acción. */
  cancelNextAuthorize: () =>
    control("next-authorize", { error: "access_denied", description: "User cancelled" }),
  /** Denegación de la Acción post-login (api.access.deny(motivo)). */
  denyNextAuthorize: (reason: "email_not_verified" | "email_missing") =>
    control("next-authorize", { error: "access_denied", description: reason }),
  state: (): Promise<{
    logouts: { target: string; accepted: boolean }[];
    authorizeRequests: Record<string, string>[];
  }> => control("state"),
};

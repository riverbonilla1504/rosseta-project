/**
 * GET /api/me al backend con una credencial ya obtenida (servidor). Traduce 401 y los 403 de
 * cuenta rechazada (contracts/auth-flow.md §5). Lo usan currentUser.ts y el callback.
 */
export type Me = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
};

export const ACCOUNT_REJECTION_CODES = [
  "account_disabled",
  "account_exists_other_provider",
  "email_missing",
  "email_not_verified",
] as const;
export type AccountRejectionCode = (typeof ACCOUNT_REJECTION_CODES)[number];

export type CurrentUserResult =
  | { status: "ok"; user: Me }
  | { status: "unauthenticated" }
  | { status: "denied"; code: AccountRejectionCode };

function isRejection(code: unknown): code is AccountRejectionCode {
  return ACCOUNT_REJECTION_CODES.includes(code as AccountRejectionCode);
}

export async function fetchMe(token: string): Promise<CurrentUserResult> {
  const backend = (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  const response = await fetch(`${backend}/api/me`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 401) return { status: "unauthenticated" };
  if (response.status === 403) {
    const code = (await response.json().catch(() => null))?.error?.code;
    if (isRejection(code)) return { status: "denied", code };
  }
  if (!response.ok) throw new Error(`GET /api/me respondió ${response.status}`);
  return { status: "ok", user: (await response.json()) as Me };
}

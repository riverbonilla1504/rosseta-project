/**
 * POST /api/me/onboarding/complete (specs/002-autenticacion-oauth/contracts/accounts-api.yaml)
 * con apiFetch: 401 y cuentas rechazadas se resuelven allí (FR-026).
 */
import type { Me } from "@/features/auth/fetchMe";
import { apiFetch } from "@/lib/api/client";

export function completeOnboarding(): Promise<Me> {
  return apiFetch<Me>("/api/me/onboarding/complete", { method: "POST" });
}

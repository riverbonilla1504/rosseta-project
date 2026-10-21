import { getCurrentUser } from "@/features/auth/currentUser";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";

/**
 * /onboarding (feature 002, T055; FR-019). La guarda de (app)/layout.tsx ya llevó aquí solo a
 * quien lo tiene pendiente (FR-018, FR-021); esta página solo necesita el nombre de la cuenta.
 */
export default async function OnboardingPage() {
  const result = await getCurrentUser();
  const name = result.status === "ok" ? result.user.full_name : "";
  return <OnboardingFlow name={name} />;
}

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/currentUser";

/**
 * Resolutor de destino tras el acceso (research R-09): onboarding pendiente → /onboarding;
 * completado → /projects; cuenta rechazada → /auth/denied; sin sesión → /login.
 * FR-014, FR-018 (ROS-89, ROS-91); FR-009, FR-011 (ROS-90).
 */
export default async function Landing(): Promise<never> {
  const result = await getCurrentUser();

  if (result.status === "unauthenticated") redirect(`/login?returnTo=${encodeURIComponent("/")}`);
  if (result.status === "denied") redirect(`/auth/denied?code=${result.code}`);
  redirect(result.user.onboarding_completed ? "/projects" : "/onboarding");
}

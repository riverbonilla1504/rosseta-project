import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/currentUser";
import { LogoutLink } from "@/features/auth/LogoutLink";
import { QueryProvider } from "@/lib/query-client";

import styles from "./layout.module.css";

/**
 * Área privada (ROS-186). Guarda de onboarding (FR-018, FR-021): el estado se consulta a la
 * cuenta en cada carga; pendiente → /onboarding, completado y en /onboarding → /projects.
 * Cierre de sesión visible en toda pantalla privada (FR-025). Compartido con las features 001
 * y 003: aquí solo la guarda y una barra mínima. QueryProvider: un QueryClient por pestaña
 * para todo el área privada (feature 003, research R-13).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-rosetta-pathname") ?? "/";
  const result = await getCurrentUser();

  if (result.status === "unauthenticated") {
    redirect(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }
  if (result.status === "denied") redirect(`/auth/denied?code=${result.code}`);

  const onOnboarding = pathname === "/onboarding";
  if (!result.user.onboarding_completed && !onOnboarding) redirect("/onboarding");
  if (result.user.onboarding_completed && onOnboarding) redirect("/projects");

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <LogoutLink className={styles.logout} />
      </header>
      <main>
        <QueryProvider>{children}</QueryProvider>
      </main>
    </div>
  );
}

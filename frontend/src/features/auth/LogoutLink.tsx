import { copy } from "./copy";

/**
 * Cierre de sesión (FR-025; ROS-186). `returnTo` es la URL absoluta de /login: el SDK la
 * reenvía tal cual al proveedor y la lista blanca del tenant tiene URLs absolutas (research
 * R-D). Sin `returnTo` el SDK usaría la raíz, que no está en la lista, y el cierre fallaría.
 */
export function LogoutLink({ className }: { className?: string }) {
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const href = `/auth/logout?returnTo=${encodeURIComponent(`${base}/login`)}`;
  return (
    <a className={className} href={href}>
      {copy.logout}
    </a>
  );
}

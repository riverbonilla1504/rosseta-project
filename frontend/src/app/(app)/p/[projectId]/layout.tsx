import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ProjectBadge } from "@/features/projects/ProjectBadge";
import styles from "@/features/projects/ProjectBar.module.css";
import { getProjectOnServer } from "@/features/projects/server";
import { ProjectSwitcher } from "@/features/projects/ProjectSwitcher";
import { ProjectTabs } from "@/features/projects/ProjectTabs";

/**
 * Navegación del proyecto (feature 003, FR-007, FR-008 y FR-009): pestañas de DP-017, insignia
 * "nombre · dialecto" y selector de proyecto. El key por projectId vuelve a montar todo lo que
 * cuelga del proyecto al cambiar de proyecto, para que ningún estado local pase al nuevo.
 * El 404 de la API (proyecto ajeno, inexistente o identificador inválido) lleva a la pantalla
 * de "no encontrado" de p/not-found.tsx, sin la barra del proyecto (FR-015, T042).
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getProjectOnServer(projectId);
  if (result.status === "unauthenticated") {
    const pathname = (await headers()).get("x-rosetta-pathname") ?? `/p/${projectId}`;
    redirect(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }
  if (result.status === "not_found") notFound();

  return (
    <div key={projectId}>
      <div className={styles.bar}>
        <ProjectTabs projectId={projectId} />
        <div className={styles.meta}>
          <ProjectBadge projectId={projectId} />
          <ProjectSwitcher projectId={projectId} />
        </div>
      </div>
      {children}
    </div>
  );
}

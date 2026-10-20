"use client";

/**
 * Insignia "nombre · dialecto" de la barra del proyecto (FR-008, DP-019): el dialecto con su
 * valor interno (tsql, oracle, postgres). Lee solo la clave de su projectId: mientras carga no
 * muestra nada, nunca el proyecto anterior (FR-009).
 */
import { useQuery } from "@tanstack/react-query";

import { getProject } from "./api";
import styles from "./ProjectBar.module.css";
import { projectKeys } from "./queryKeys";

export function ProjectBadge({ projectId }: { projectId: string }) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: ({ signal }) => getProject(projectId, signal),
  });

  if (!project.data) return null;
  return (
    <span className={styles.badge} data-testid="project-badge">
      {`${project.data.name} · ${project.data.source_dialect}`}
    </span>
  );
}

"use client";

/**
 * Selector de proyecto de la barra del proyecto (FR-009): los proyectos activos de la persona.
 * Al elegir otro, cancela las consultas en curso del actual y navega al Panorama del nuevo; cada
 * pantalla lee solo las claves de su projectId, así que una respuesta tardía del anterior se
 * queda en su clave y nunca se pinta en el nuevo (research R-13).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { listProjects } from "./api";
import { projectsCopy } from "./copy";
import styles from "./ProjectBar.module.css";
import { projectKeys } from "./queryKeys";

export function ProjectSwitcher({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const projects = useQuery({
    queryKey: projectKeys.list(false),
    queryFn: ({ signal }) => listProjects(false, signal),
  });

  if (!projects.data) return null;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === projectId) return;
    // Aborta en el acto (la promesa solo avisa de que terminó): no hace falta esperarla.
    void queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) });
    router.push(`/p/${next}`);
  }

  return (
    <select
      className={styles.switcher}
      aria-label={projectsCopy.switchProject}
      value={projectId}
      onChange={handleChange}
    >
      {projects.data.results.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}

"use client";

/**
 * Lista de proyectos de /projects (feature 003, ROS-174): FR-005 (proyectos activos con sus
 * cifras, en el orden de la API: última actividad, la más reciente primero), FR-006 (estado
 * vacío), FR-001 (crear con el formulario compartido entra en el proyecto nuevo) y FR-012 (filtro
 * de archivados; un archivado se abre en solo lectura).
 */
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { listProjects, type ProjectSummary } from "./api";
import { DIALECT_LABELS, projectsCopy } from "./copy";
import { formatCount, formatDate, formatRatio } from "./format";
import { ProjectForm } from "./ProjectForm";
import styles from "./ProjectList.module.css";
import { projectKeys } from "./queryKeys";

function ProjectsTable({ projects }: { projects: ProjectSummary[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">{projectsCopy.columnName}</th>
          <th scope="col">{projectsCopy.columnDialect}</th>
          <th scope="col">{projectsCopy.columnActivity}</th>
          <th scope="col" className={styles.number}>
            {projectsCopy.columnTables}
          </th>
          <th scope="col" className={styles.number}>
            {projectsCopy.columnColumns}
          </th>
          <th scope="col" className={styles.number}>
            {projectsCopy.columnConfirmed}
          </th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id}>
            <td>
              <Link className={styles.link} href={`/p/${project.id}`}>
                {project.name}
              </Link>
            </td>
            <td>{DIALECT_LABELS[project.source_dialect]}</td>
            <td>{formatDate(project.last_activity_at)}</td>
            <td className={styles.number}>{formatCount(project.table_count)}</td>
            <td className={styles.number}>{formatCount(project.column_count)}</td>
            <td className={styles.number}>{formatRatio(project.confirmed_ratio)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ProjectList() {
  const router = useRouter();
  const [archived, setArchived] = useState(false);
  const projects = useQuery({
    queryKey: projectKeys.list(archived),
    queryFn: ({ signal }) => listProjects(archived, signal),
  });

  return (
    <div className={styles.list}>
      <section aria-busy={projects.isPending}>
        <button
          className={styles.filter}
          type="button"
          aria-pressed={archived}
          onClick={() => setArchived((value) => !value)}
        >
          {archived ? projectsCopy.showActive : projectsCopy.showArchived}
        </button>
        {projects.isError && (
          <p className={styles.notice} role="alert">
            {projectsCopy.genericError}
          </p>
        )}
        {projects.data &&
          (projects.data.results.length > 0 ? (
            <ProjectsTable projects={projects.data.results} />
          ) : (
            // Sin proyectos activos (también si todos están archivados): el estado vacío. El
            // filtro de archivados vacío no tiene texto propio en 04-contenido §5.
            !archived && <p className={styles.notice}>{projectsCopy.empty}</p>
          ))}
      </section>
      <section className={styles.create}>
        <ProjectForm onCreated={(project) => router.push(`/p/${project.id}`)} />
      </section>
    </div>
  );
}

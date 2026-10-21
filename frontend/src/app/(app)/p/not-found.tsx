import Link from "next/link";

import { projectsCopy } from "@/features/projects/copy";
import styles from "@/features/projects/ProjectTabPlaceholder.module.css";

/**
 * "No encontrado" del proyecto (feature 003, T042; FR-015): la misma pantalla para un proyecto
 * ajeno, inexistente o con un identificador inválido, porque la API responde el mismo 404. Vive
 * en el segmento p/ y no en p/[projectId]/: Next.js atiende el notFound() de un layout con la
 * pantalla del segmento padre, y así la barra del proyecto (pestañas, insignia) no se pinta.
 */
export default function ProjectNotFound() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{projectsCopy.notFound}</h1>
      <p className={styles.empty}>
        <Link href="/projects" className={styles.link}>
          {projectsCopy.goToProjects}
        </Link>
      </p>
    </section>
  );
}

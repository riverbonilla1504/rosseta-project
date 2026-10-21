import { projectsCopy } from "@/features/projects/copy";
import { ProjectList } from "@/features/projects/ProjectList";

import styles from "./page.module.css";

/** Pantalla de proyectos (03-pantallas, Proyectos; feature 003, FR-005, FR-006 y FR-001). */
export default function ProjectsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{projectsCopy.title}</h1>
      <ProjectList />
    </div>
  );
}

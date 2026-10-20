"use client";

/**
 * Contenido provisional de una pestaña del proyecto hasta que llegue su feature (research R-14):
 * sin fuentes, el estado de proyecto sin fuentes de 04-contenido §5; con fuentes, que su
 * pantalla aún no está disponible (DP-028). Lee el estado de su proyecto (T053); mientras carga
 * no muestra ninguno de los dos.
 */
import { useParams } from "next/navigation";

import { useProjectState } from "./api";
import { projectsCopy } from "./copy";
import styles from "./ProjectTabPlaceholder.module.css";

export function ProjectTabPlaceholder({ title }: { title: string }) {
  const { projectId } = useParams<{ projectId: string }>();
  const state = useProjectState(projectId);

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {state.data && (
        <p className={styles.empty}>
          {state.data.sources.length === 0
            ? projectsCopy.noEvidence
            : projectsCopy.tabUnavailable(title)}
        </p>
      )}
    </section>
  );
}

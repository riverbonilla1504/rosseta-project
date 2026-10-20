/**
 * Contenido provisional de una pestaña del proyecto hasta que llegue su feature (research R-14):
 * el estado de proyecto sin fuentes de 04-contenido §5. La variante "con fuentes" depende del
 * estado del proyecto (T048, T053) y usa el texto de DP-028.
 */
import { projectsCopy } from "./copy";
import styles from "./ProjectTabPlaceholder.module.css";

export function ProjectTabPlaceholder({ title }: { title: string }) {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.empty}>{projectsCopy.noEvidence}</p>
    </section>
  );
}

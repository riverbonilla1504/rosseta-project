import styles from "./page.module.css";

/** Página provisional del esqueleto. Las pantallas reales llegan con las features 001–009. */
export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.brand}>
        Rosetta <span className={styles.tagline}>MOTOR DE EVIDENCIA</span>
      </h1>
      <p className={styles.note}>
        Esqueleto del proyecto. Las pantallas se construyen desde las specs.
      </p>
    </main>
  );
}

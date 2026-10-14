"use client";

import { AuthError } from "@/features/auth/AuthError";
import { copy } from "@/features/auth/copy";

import styles from "./(public)/login/page.module.css";

/**
 * Error inesperado al cargar una página (backend o servicio de identidad sin respuesta): nunca
 * la página por defecto ni una pantalla en blanco, siempre el error genérico con salida
 * (FR-039, FR-038; ROS-90). El detalle del error no se muestra (FR-033).
 */
type ErrorProps = { error: Error & { digest?: string }; reset: () => void };

// Next.js entrega error y reset; no se usan: el detalle no se muestra y la salida es un enlace.
export default function AppError(props: ErrorProps) {
  void props;
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.brand}>{copy.brand}</h1>
        <AuthError message={copy.errors.generic} retryHref="/" />
      </section>
    </main>
  );
}

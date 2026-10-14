"use client";

import { useEffect, useRef } from "react";

import { copy } from "./copy";
import styles from "./AuthError.module.css";

/**
 * Mensaje de error de acceso con salida (FR-038, FR-039) y accesibilidad de FR-040: el mensaje
 * se anuncia a los lectores de pantalla (role="alert", 4.1.3) y recibe el foco al llegar.
 */
export function AuthError({ message, retryHref }: { message: string; retryHref: string }) {
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    messageRef.current?.focus();
  }, []);

  return (
    <>
      <p ref={messageRef} role="alert" tabIndex={-1} className={styles.message}>
        {message}
      </p>
      <a className={styles.retry} href={retryHref}>
        {copy.retry}
      </a>
    </>
  );
}

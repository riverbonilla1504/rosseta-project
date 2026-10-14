"use client";

import AppError from "./error";
import "./globals.css";

/** Error en el layout raíz: mismo contenido que error.tsx con su propio html (FR-039). */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <AppError {...props} />
      </body>
    </html>
  );
}

/**
 * Formatos de la lista de proyectos según docs/05-diseno/04-contenido-y-redaccion.md §1:
 * números es-CO (`18.442`), porcentajes `96,1%` y fechas `29 sep 2026, 14:03`.
 */
import { projectsCopy } from "./copy";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const COUNT = new Intl.NumberFormat("es-CO");

const pad = (value: number) => String(value).padStart(2, "0");

/** Fecha y hora locales: `19 oct 2026, 14:03`. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return `${day}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatCount(value: number): string {
  return COUNT.format(value);
}

/** Proporción confirmada con un decimal y sin espacio (`22,3%`); sin columnas, "–" (DP-020). */
export function formatRatio(ratio: number | null): string {
  if (ratio === null) return projectsCopy.noRatio;
  return `${(ratio * 100).toFixed(1).replace(".", ",")}%`;
}

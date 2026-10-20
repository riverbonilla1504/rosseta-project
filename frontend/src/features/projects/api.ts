/**
 * Llamadas a /api/projects (specs/003-proyectos-y-nucleo-de-datos/contracts/projects-api.yaml)
 * con apiFetch: 401 y cuentas rechazadas se resuelven allí (feature 002, FR-026).
 */
import { apiFetch } from "@/lib/api/client";

export type Dialect = "tsql" | "oracle" | "postgres";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  source_dialect: Dialect;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  last_activity_at: string;
  table_count: number;
  column_count: number;
  /** Confirmadas (directas + propagadas, DP-020) / columnas; null sin columnas. */
  confirmed_ratio: number | null;
};

export type ProjectInput = { name: string; source_dialect: Dialect };

/** Paginación estándar de 05-api §1. */
export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

/**
 * Lista y selector piden una sola página del tamaño máximo de 05-api §1 (200), ya ordenada por
 * última actividad (FR-005); la spec no pide paginar la lista en la interfaz.
 */
const LIST_PAGE_SIZE = 200;

const JSON_HEADERS = { "content-type": "application/json" };

export function createProject(input: ProjectInput): Promise<ProjectSummary> {
  return apiFetch<ProjectSummary>("/api/projects", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export function getProject(projectId: string, signal?: AbortSignal): Promise<ProjectSummary> {
  return apiFetch<ProjectSummary>(`/api/projects/${encodeURIComponent(projectId)}`, { signal });
}

export function listProjects(
  archived: boolean,
  signal?: AbortSignal,
): Promise<Page<ProjectSummary>> {
  const params = new URLSearchParams({
    archived: String(archived),
    page_size: String(LIST_PAGE_SIZE),
  });
  return apiFetch<Page<ProjectSummary>>(`/api/projects?${params.toString()}`, { signal });
}

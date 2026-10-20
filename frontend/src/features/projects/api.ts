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

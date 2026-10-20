/**
 * Llamadas a /api/projects (specs/003-proyectos-y-nucleo-de-datos/contracts/projects-api.yaml)
 * con apiFetch: 401 y cuentas rechazadas se resuelven allí (feature 002, FR-026).
 */
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

import { projectKeys } from "./queryKeys";

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

export type Level = "CONFIRMED" | "HIGH_UNVALIDATED" | "INFERRED" | "HYPOTHESIS" | "UNKNOWN";

/** Estado al abrir el proyecto (05-api §3.10, GET /api/projects/{id}/state). */
export type ProjectState = {
  project: ProjectSummary;
  coverage: { total_columns: number; by_level: Record<Level, number> };
  sources: {
    id: string;
    kind: "SCHEMA_DDL" | "DATA_SAMPLE";
    status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
    original_filename: string;
    created_at: string;
  }[];
  table_count: number;
  queue_head: {
    column_id: string;
    identifier: string;
    level: Level;
    impact: number;
    has_open_conflict: boolean;
  }[];
};

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

export function getProjectState(projectId: string, signal?: AbortSignal): Promise<ProjectState> {
  return apiFetch<ProjectState>(`/api/projects/${encodeURIComponent(projectId)}/state`, {
    signal,
  });
}

/**
 * Estado del proyecto guardado en el cliente por proyecto (ROS-177, research R-13): la clave
 * lleva el projectId, así que el estado de otro proyecto nunca se pinta en este (FR-009).
 */
export function useProjectState(projectId: string) {
  return useQuery({
    queryKey: projectKeys.state(projectId),
    queryFn: ({ signal }) => getProjectState(projectId, signal),
  });
}

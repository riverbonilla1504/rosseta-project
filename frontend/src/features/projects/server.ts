/**
 * GET /api/projects/{id} desde componentes de servidor (feature 003, T042): el layout del
 * proyecto lo usa para llevar el 404 de la API a la pantalla de "no encontrado" (FR-015). La
 * credencial la renueva antes el middleware; aquí solo se lee (feature 002, FR-022).
 */
import { classifyTokenError } from "@/lib/api/proxy";
import { auth0 } from "@/lib/auth0";

import type { ProjectSummary } from "./api";

export type ServerProjectResult =
  | { status: "ok"; project: ProjectSummary }
  | { status: "not_found" }
  | { status: "unauthenticated" };

export async function getProjectOnServer(projectId: string): Promise<ServerProjectResult> {
  let token: string;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (error) {
    if (classifyTokenError(error).code === "session_expired") return { status: "unauthenticated" };
    throw error;
  }

  const backend = (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  const response = await fetch(`${backend}/api/projects/${encodeURIComponent(projectId)}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) return { status: "not_found" };
  if (response.status === 401) return { status: "unauthenticated" };
  if (!response.ok) throw new Error(`GET /api/projects/{id} respondió ${response.status}`);
  return { status: "ok", project: (await response.json()) as ProjectSummary };
}

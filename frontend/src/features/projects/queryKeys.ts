/**
 * Claves de TanStack Query (research R-13). Cada pantalla de un proyecto lee solo las claves de
 * su projectId de la ruta: una respuesta tardía del proyecto anterior queda en su propia clave y
 * nunca se pinta en el nuevo (FR-009).
 */
export const projectKeys = {
  all: ["projects"] as const,
  list: (archived: boolean) => ["projects", { archived }] as const,
  detail: (projectId: string) => ["project", projectId] as const,
  state: (projectId: string) => ["project", projectId, "state"] as const,
};

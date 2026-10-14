import { describe, expect, it } from "vitest";

import { DEFAULT_RETURN_TO, safeReturnTo } from "@/features/auth/safeReturnTo";

describe("safeReturnTo", () => {
  it("[ROS-93][002:FR-015] acepta rutas internas con consulta y fragmento", () => {
    expect(safeReturnTo("/projects")).toBe("/projects");
    expect(safeReturnTo("/p/123/sources?tab=ddl#top")).toBe("/p/123/sources?tab=ddl#top");
  });

  it.each([
    "https://evil.example/phish",
    "http://localhost:3000/projects",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "/%2F%2Fevil.example",
    "/%5Cevil.example",
    "/../etc/passwd",
    "/projects/../../admin",
    "/%2e%2e/admin",
    "projects",
    " /projects",
    "/\tprojects",
  ])("[ROS-93][002:FR-015] descarta el destino inseguro %j", (value) => {
    expect(safeReturnTo(value)).toBe(DEFAULT_RETURN_TO);
  });

  it.each([undefined, null, "", ["/projects", "/x"]])(
    "[ROS-93][002:FR-015] vacío o inválido → destino por defecto (%j)",
    (value) => {
      expect(safeReturnTo(value as never)).toBe(DEFAULT_RETURN_TO);
    },
  );

  it("[ROS-93][002:FR-015] el destino por defecto es la raíz, que resuelve onboarding o proyectos", () => {
    expect(DEFAULT_RETURN_TO).toBe("/");
  });
});

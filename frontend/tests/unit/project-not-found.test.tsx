import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { projectsCopy } from "@/features/projects/copy";

/**
 * "No encontrado" del proyecto (T042 de la feature 003; FR-015): el 404 de la API, sea un proyecto
 * ajeno, inexistente o con un identificador inválido, lleva a la misma pantalla.
 */
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ notFound, redirect }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-rosetta-pathname": "/p/p1/review" }),
}));

const getAccessToken = vi.fn();
vi.mock("@/lib/auth0", () => ({ auth0: { getAccessToken } }));

vi.mock("@/features/projects/ProjectTabs", () => ({ ProjectTabs: () => <nav>pestañas</nav> }));
vi.mock("@/features/projects/ProjectBadge", () => ({ ProjectBadge: () => <span>insignia</span> }));
vi.mock("@/features/projects/ProjectSwitcher", () => ({ ProjectSwitcher: () => null }));
vi.mock("@/features/projects/ArchiveControls", () => ({ ArchiveControls: () => null }));

const { getProjectOnServer } = await import("@/features/projects/server");
const { default: ProjectLayout } = await import("@/app/(app)/p/[projectId]/layout");
const { default: ProjectNotFound } = await import("@/app/(app)/p/not-found");

const summary = {
  id: "p1",
  name: "CORE_PRD",
  description: "",
  source_dialect: "tsql",
  archived: false,
  archived_at: null,
  created_at: "2026-10-19T10:00:00Z",
  last_activity_at: "2026-10-19T10:00:00Z",
  table_count: 0,
  column_count: 0,
  confirmed_ratio: null,
};

const fetchMock = vi.fn();

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("no encontrado del proyecto", () => {
  beforeEach(() => {
    notFound.mockClear();
    redirect.mockClear();
    fetchMock.mockReset();
    getAccessToken.mockReset().mockResolvedValue({ token: "tok" });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("BACKEND_INTERNAL_URL", "http://backend.test/");
  });

  it("[ROS-84][003:FR-015] la pantalla dice que no existe o no hay acceso y lleva a tus proyectos", () => {
    render(<ProjectNotFound />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(projectsCopy.notFound);
    expect(screen.getByRole("link", { name: projectsCopy.goToProjects })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("[ROS-84][003:FR-015] getProjectOnServer pide el proyecto al backend con la credencial", async () => {
    answer(200, summary);

    await expect(getProjectOnServer("p 1")).resolves.toEqual({ status: "ok", project: summary });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend.test/api/projects/p%201");
    expect(init.headers.authorization).toBe("Bearer tok");
    expect(init.cache).toBe("no-store");
  });

  it("[ROS-84][003:FR-015] un 404 de la API es «no encontrado», un 401 es sesión vencida", async () => {
    answer(404, { error: { code: "not_found", message: "x", details: {} } });
    await expect(getProjectOnServer("ajeno")).resolves.toEqual({ status: "not_found" });

    answer(401, { error: { code: "session_expired", message: "x", details: {} } });
    await expect(getProjectOnServer("p1")).resolves.toEqual({ status: "unauthenticated" });

    answer(500, {});
    await expect(getProjectOnServer("p1")).rejects.toThrow(/500/);
  });

  it("[ROS-84][003:FR-015] el layout del proyecto lleva el 404 de la API a la pantalla de no encontrado", async () => {
    answer(404, { error: { code: "not_found", message: "x", details: {} } });

    await expect(
      ProjectLayout({ children: <p>contenido</p>, params: Promise.resolve({ projectId: "x" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("[ROS-78][003:FR-007] con el proyecto propio, el layout pinta su barra y el contenido", async () => {
    answer(200, summary);

    render(
      await ProjectLayout({
        children: <p>contenido</p>,
        params: Promise.resolve({ projectId: "p1" }),
      }),
    );

    expect(screen.getByText("pestañas")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("[ROS-92][002:FR-026] sin sesión, el layout del proyecto lleva al acceso con el regreso", async () => {
    answer(401, { error: { code: "session_expired", message: "x", details: {} } });

    await expect(
      ProjectLayout({ children: <p />, params: Promise.resolve({ projectId: "p1" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirect).toHaveBeenCalledWith("/login?returnTo=%2Fp%2Fp1%2Freview");
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { projectsCopy } from "@/features/projects/copy";
import { QueryProvider } from "@/lib/query-client";

/**
 * Selector de proyecto e insignia de la barra del proyecto (FR-008 y FR-009 de la feature 003):
 * al cambiar de proyecto se cancelan las consultas del anterior y una respuesta suya que llegue
 * tarde nunca se pinta en el nuevo.
 */
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { ProjectBadge } = await import("@/features/projects/ProjectBadge");
const { ProjectSwitcher } = await import("@/features/projects/ProjectSwitcher");

const summary = (id: string, name: string, source_dialect: string) => ({
  id,
  name,
  description: "",
  source_dialect,
  archived: false,
  archived_at: null,
  created_at: "2026-10-19T10:00:00Z",
  last_activity_at: "2026-10-19T10:00:00Z",
  table_count: 0,
  column_count: 0,
  confirmed_ratio: null,
});
const A = summary("aaaaaaaa-0000-4000-8000-000000000001", "Ventas", "oracle");
const B = summary("bbbbbbbb-0000-4000-8000-000000000002", "Compras", "postgres");

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type Pending = { resolve: () => void; signal: AbortSignal | null | undefined };

/** Respuestas del detalle retenidas hasta que la prueba las suelte (red lenta). */
const pending = new Map<string, Pending>();
const fetchMock = vi.fn();

function routeFetch() {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const path = new URL(url, "http://localhost").pathname;
    if (path === "/api/projects") {
      return Promise.resolve(json(200, { count: 2, next: null, previous: null, results: [A, B] }));
    }
    const project = [A, B].find((item) => path === `/api/projects/${item.id}`);
    if (!project) return Promise.resolve(json(404, { error: { code: "not_found" } }));
    // La respuesta llega cuando la prueba la suelta, aunque la consulta se haya cancelado.
    return new Promise<Response>((resolve) => {
      pending.set(project.id, {
        resolve: () => resolve(json(200, project)),
        signal: init?.signal,
      });
    });
  });
}

function Bar({ projectId }: { projectId: string }) {
  return (
    <>
      <ProjectBadge projectId={projectId} />
      <ProjectSwitcher projectId={projectId} />
    </>
  );
}

function renderBar(projectId: string) {
  const view = render(
    <QueryProvider>
      <Bar projectId={projectId} />
    </QueryProvider>,
  );
  return {
    ...view,
    navigateTo: (next: string) =>
      view.rerender(
        <QueryProvider>
          <Bar projectId={next} />
        </QueryProvider>,
      ),
  };
}

const switcher = () => screen.findByRole("combobox", { name: projectsCopy.switchProject });

describe("selector de proyecto", () => {
  beforeEach(() => {
    push.mockReset();
    pending.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    routeFetch();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[ROS-78][003:FR-009] lista los proyectos activos con el actual seleccionado", async () => {
    renderBar(A.id);

    const select = await switcher();
    const options = within(select)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Ventas", "Compras"]);
    expect(select).toHaveValue(A.id);
    const listCall = fetchMock.mock.calls
      .map(([url]) => new URL(url, "http://localhost"))
      .find((url) => url.pathname === "/api/projects");
    expect(listCall?.searchParams.get("archived")).toBe("false");
  });

  it("[ROS-78][003:FR-008] la insignia muestra «nombre · dialecto» con el valor interno", async () => {
    renderBar(A.id);

    await waitFor(() => expect(pending.has(A.id)).toBe(true));
    pending.get(A.id)?.resolve();

    expect(await screen.findByText("Ventas · oracle")).toBeInTheDocument();
  });

  it("[ROS-78][003:FR-009] al cambiar cancela las consultas del anterior y su respuesta tardía nunca se pinta en el nuevo", async () => {
    const { navigateTo } = renderBar(A.id);
    const select = await switcher();
    await waitFor(() => expect(pending.has(A.id)).toBe(true));

    fireEvent.change(select, { target: { value: B.id } });

    expect(push).toHaveBeenCalledWith(`/p/${B.id}`);
    await waitFor(() => expect(pending.get(A.id)?.signal?.aborted).toBe(true));

    navigateTo(B.id);
    await waitFor(() => expect(pending.has(B.id)).toBe(true));
    // Mientras carga B no hay nada de A.
    expect(screen.queryByText(/Ventas · /)).not.toBeInTheDocument();

    pending.get(A.id)?.resolve();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText(/Ventas · /)).not.toBeInTheDocument();

    pending.get(B.id)?.resolve();
    expect(await screen.findByText("Compras · postgres")).toBeInTheDocument();
    expect(screen.queryByText(/Ventas · /)).not.toBeInTheDocument();
  });
});

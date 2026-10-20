import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { projectsCopy } from "@/features/projects/copy";
import { QueryProvider } from "@/lib/query-client";

/**
 * Renombrar, archivar, solo lectura y desarchivar (T056 de la feature 003; FR-010…FR-013) y el
 * filtro de archivados de /projects (FR-012). Textos de 04-contenido §5 (DP-028).
 */
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const { ArchiveControls } = await import("@/features/projects/ArchiveControls");
const { ProjectList } = await import("@/features/projects/ProjectList");

const ID = "8d3f0c1e-2b4a-4c5d-9e6f-7a8b9c0d1e2f";

function summary(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    name: "Ventas",
    description: "",
    source_dialect: "oracle",
    archived: false,
    archived_at: null,
    created_at: "2026-10-01T15:00:00Z",
    last_activity_at: "2026-10-19T15:00:00Z",
    table_count: 0,
    column_count: 0,
    confirmed_ratio: null,
    ...overrides,
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const apiError = (code: string, details: Record<string, unknown> = {}) => ({
  error: { code, message: "x", details },
});

type Route = (url: string, init: RequestInit) => Response | undefined;
let routes: Route[] = [];
const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
  for (const route of routes) {
    const response = route(url, init);
    if (response) return response;
  }
  throw new Error(`sin respuesta para ${init.method ?? "GET"} ${url}`);
});

const patches = () =>
  fetchMock.mock.calls
    .filter(([, init]) => init?.method === "PATCH")
    .map(([url, init]) => [url, JSON.parse(String(init?.body))]);

function detail(project: Record<string, unknown>): Route {
  return (url, init) =>
    url === `/api/projects/${ID}` && (init.method ?? "GET") === "GET"
      ? json(200, project)
      : undefined;
}

function onPatch(...responses: Response[]): Route {
  return (url, init) =>
    url === `/api/projects/${ID}` && init.method === "PATCH" ? responses.shift() : undefined;
}

function renderControls() {
  render(
    <QueryProvider>
      <ArchiveControls projectId={ID} />
    </QueryProvider>,
  );
}

describe("controles de archivo del proyecto", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    fetchMock.mockClear();
    routes = [];
    vi.stubGlobal("fetch", fetchMock);
  });

  it("[ROS-78][003:FR-011] renombrar valida como el formulario y envía el nombre recortado", async () => {
    routes = [detail(summary()), onPatch(json(200, summary({ name: "Ventas 2026" })))];
    renderControls();

    fireEvent.click(await screen.findByRole("button", { name: "Renombrar" }));
    const dialog = screen.getByRole("dialog", { name: "Renombrar proyecto" });
    const field = within(dialog).getByLabelText(projectsCopy.nameLabel);
    expect(field).toHaveValue("Ventas");

    fireEvent.change(field, { target: { value: "   " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(projectsCopy.nameRequired);
    fireEvent.change(field, { target: { value: "a".repeat(121) } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(projectsCopy.nameTooLong);
    expect(patches()).toEqual([]);

    fireEvent.change(field, { target: { value: "  Ventas 2026 " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(patches()).toEqual([[`/api/projects/${ID}`, { name: "Ventas 2026" }]]);
  });

  it("[ROS-78][003:FR-011] un nombre repetido se indica junto al campo y Cancelar no envía nada", async () => {
    routes = [
      detail(summary()),
      onPatch(json(400, apiError("project_name_taken", { name: ["x"] }))),
    ];
    renderControls();

    fireEvent.click(await screen.findByRole("button", { name: "Renombrar" }));
    const dialog = screen.getByRole("dialog", { name: "Renombrar proyecto" });
    fireEvent.change(within(dialog).getByLabelText(projectsCopy.nameLabel), {
      target: { value: "CORE_PRD" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(projectsCopy.nameTaken);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[ROS-78][003:FR-010][003:FR-012] archivar pide confirmación y lleva a /projects", async () => {
    routes = [detail(summary()), onPatch(json(200, summary({ archived: true })))];
    renderControls();

    fireEvent.click(await screen.findByRole("button", { name: "Archivar" }));
    const dialog = screen.getByRole("dialog", { name: "Archivar Ventas" });
    expect(dialog).toHaveTextContent(
      "El proyecto deja de aparecer en tu lista. Sus datos se conservan y puedes desarchivarlo cuando quieras.",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(patches()).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Archivar" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Archivar Ventas" })).getByRole("button", {
        name: "Archivar",
      }),
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects"));
    expect(patches()).toEqual([[`/api/projects/${ID}`, { archived: true }]]);
  });

  it("[ROS-78][003:FR-013] un archivado muestra el aviso de solo lectura sin controles de modificación", async () => {
    routes = [detail(summary({ archived: true, archived_at: "2026-10-19T16:00:00Z" }))];
    renderControls();

    expect(
      await screen.findByText("Proyecto archivado: solo lectura. Desarchívalo para hacer cambios."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desarchivar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Renombrar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivar" })).not.toBeInTheDocument();
  });

  it("[ROS-78][003:FR-013] desarchivar con el nombre libre reactiva el proyecto", async () => {
    routes = [
      detail(summary({ archived: true, archived_at: "2026-10-19T16:00:00Z" })),
      onPatch(json(200, summary())),
    ];
    renderControls();

    fireEvent.click(await screen.findByRole("button", { name: "Desarchivar" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(patches()).toEqual([[`/api/projects/${ID}`, { archived: false }]]);
  });

  it("[ROS-78][003:FR-004][003:FR-013] desarchivar con el nombre ocupado pide uno nuevo antes", async () => {
    routes = [
      detail(summary({ archived: true, archived_at: "2026-10-19T16:00:00Z" })),
      onPatch(
        json(400, apiError("project_name_taken", { name: ["x"] })),
        json(200, summary({ name: "Ventas 2025" })),
      ),
    ];
    renderControls();

    fireEvent.click(await screen.findByRole("button", { name: "Desarchivar" }));
    expect(
      await screen.findByText(
        "Ya tienes un proyecto activo llamado Ventas. Elige otro nombre para desarchivarlo.",
      ),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(projectsCopy.nameLabel), {
      target: { value: " Ventas 2025 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Desarchivar" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(patches()).toEqual([
      [`/api/projects/${ID}`, { archived: false }],
      [`/api/projects/${ID}`, { archived: false, name: "Ventas 2025" }],
    ]);
  });
});

describe("filtro de archivados de /projects", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("[ROS-78][003:FR-012] «Ver archivados» lista solo los archivados y «Ver activos» vuelve", async () => {
    const page = (results: unknown[]) => ({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
    routes = [
      (url) =>
        url.startsWith("/api/projects?archived=false")
          ? json(200, page([summary({ id: "a1", name: "Activo" })]))
          : undefined,
      (url) =>
        url.startsWith("/api/projects?archived=true")
          ? json(200, page([summary({ id: "z9", name: "Viejo", archived: true })]))
          : undefined,
    ];
    render(
      <QueryProvider>
        <ProjectList />
      </QueryProvider>,
    );

    expect(await screen.findByRole("link", { name: "Activo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver archivados" }));

    expect(await screen.findByRole("link", { name: "Viejo" })).toHaveAttribute("href", "/p/z9");
    expect(screen.queryByRole("link", { name: "Activo" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver activos" }));
    expect(await screen.findByRole("link", { name: "Activo" })).toBeInTheDocument();
  });
});

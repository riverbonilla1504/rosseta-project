import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { projectsCopy } from "@/features/projects/copy";
import { QueryProvider } from "@/lib/query-client";

/** Lista de proyectos de /projects (FR-005, FR-006 y FR-001 de la feature 003). */
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { ProjectList } = await import("@/features/projects/ProjectList");

const base = {
  description: "",
  archived: false,
  archived_at: null,
  created_at: "2026-10-01T15:00:00Z",
};
const core = {
  ...base,
  id: "8d3f0c1e-2b4a-4c5d-9e6f-7a8b9c0d1e2f",
  name: "CORE_PRD",
  source_dialect: "tsql",
  last_activity_at: "2026-10-19T15:00:00Z",
  table_count: 918,
  column_count: 18442,
  confirmed_ratio: 0.2234,
};
const empty = {
  ...base,
  id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  name: "Ventas",
  source_dialect: "oracle",
  last_activity_at: "2026-10-18T15:00:00Z",
  table_count: 0,
  column_count: 0,
  confirmed_ratio: null,
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const page = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const fetchMock = vi.fn();

function renderList() {
  render(
    <QueryProvider>
      <ProjectList />
    </QueryProvider>,
  );
}

describe("lista de proyectos", () => {
  beforeEach(() => {
    push.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[ROS-78][003:FR-006] sin proyectos activos muestra «Aún no tienes proyectos.» y la acción de crear", async () => {
    fetchMock.mockResolvedValue(json(200, page([])));

    renderList();

    expect(await screen.findByText("Aún no tienes proyectos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: projectsCopy.submit })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[ROS-78][003:FR-005] pide solo los proyectos activos", async () => {
    fetchMock.mockResolvedValue(json(200, page([])));

    renderList();

    await screen.findByText("Aún no tienes proyectos.");
    const url = new URL(fetchMock.mock.calls[0][0], "http://localhost");
    expect(url.pathname).toBe("/api/projects");
    expect(url.searchParams.get("archived")).toBe("false");
  });

  it("[ROS-78][003:FR-005] cada fila muestra nombre, dialecto, fecha, tablas, columnas y porcentaje, en el orden de la API", async () => {
    fetchMock.mockResolvedValue(json(200, page([core, empty])));

    renderList();

    const table = await screen.findByRole("table");
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent);
    expect(headers).toEqual([
      "Nombre",
      "Dialecto",
      "Última actividad",
      "Tablas",
      "Columnas",
      "Confirmadas",
    ]);
    const [, first, second] = within(table).getAllByRole("row");
    const cells = (row: HTMLElement) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);

    const [name, dialect, date, tables, columns, ratio] = cells(first);
    expect(name).toBe("CORE_PRD");
    expect(dialect).toBe("SQL Server");
    expect(date).toMatch(/^19 oct 2026, \d{2}:\d{2}$/);
    expect([tables, columns, ratio]).toEqual(["918", "18.442", "22,3%"]);
    // Sin columnas no hay porcentaje (DP-020): "–" (DP-028, provisional).
    expect(cells(second)).toEqual([
      "Ventas",
      "Oracle",
      expect.stringMatching(/^18 oct 2026, /),
      "0",
      "0",
      "–",
    ]);
  });

  it("[ROS-78][003:FR-005] el nombre abre el proyecto", async () => {
    fetchMock.mockResolvedValue(json(200, page([core])));

    renderList();

    const link = await screen.findByRole("link", { name: "CORE_PRD" });
    expect(link).toHaveAttribute("href", `/p/${core.id}`);
  });

  it("[ROS-78][003:FR-001] crear desde la lista entra en el proyecto nuevo (/p/{id})", async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === "POST" ? json(201, empty) : json(200, page([core])),
    );

    renderList();

    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText(projectsCopy.nameLabel), {
      target: { value: "Ventas" },
    });
    fireEvent.click(screen.getByLabelText("Oracle"));
    fireEvent.click(screen.getByRole("button", { name: projectsCopy.submit }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/p/${empty.id}`));
  });
});

import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { projectsCopy, TAB_LABELS } from "@/features/projects/copy";
import { makeQueryClient } from "@/lib/query-client";

/**
 * Estado del proyecto en el cliente (T048 de la feature 003; FR-022, research R-13): se guarda
 * por proyecto y las pestañas muestran el estado sin fuentes solo si el proyecto no tiene fuentes.
 */
let projectId = "p1";
vi.mock("next/navigation", () => ({ useParams: () => ({ projectId }) }));

const { useProjectState } = await import("@/features/projects/api");
const { ProjectTabPlaceholder } = await import("@/features/projects/ProjectTabPlaceholder");

const levels = { CONFIRMED: 0, HIGH_UNVALIDATED: 0, INFERRED: 0, HYPOTHESIS: 0, UNKNOWN: 0 };

function stateOf(id: string, sources: unknown[]) {
  return {
    project: { id, name: `Proyecto ${id}` },
    coverage: { total_columns: 0, by_level: levels },
    sources,
    table_count: 0,
    queue_head: [],
  };
}

const ddl = {
  id: "s1",
  kind: "SCHEMA_DDL",
  status: "READY",
  original_filename: "core_demo.sql",
  created_at: "2026-10-19T10:00:00Z",
};

const fetchMock = vi.fn();

function answer(body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

function renderWith(client: ReturnType<typeof makeQueryClient>, node: React.ReactNode) {
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

function StateProbe({ id }: { id: string }) {
  const state = useProjectState(id);
  return <p>{state.data ? `estado de ${state.data.project.name}` : "cargando"}</p>;
}

describe("estado del proyecto", () => {
  beforeEach(() => {
    projectId = "p1";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("[ROS-81][003:FR-022] useProjectState pide /state y lo guarda con la clave de su proyecto", async () => {
    const client = makeQueryClient();
    answer(stateOf("p1", []));

    renderWith(client, <StateProbe id="p1" />);

    expect(await screen.findByText("estado de Proyecto p1")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/projects/p1/state");
    expect(client.getQueryData(["project", "p1", "state"])).toEqual(stateOf("p1", []));
    expect(client.getQueryData(["project", "p2", "state"])).toBeUndefined();
  });

  it("[ROS-81][003:FR-022] el estado de otro proyecto guardado nunca se muestra en este", async () => {
    const client = makeQueryClient();
    client.setQueryData(["project", "p1", "state"], stateOf("p1", [ddl]));
    fetchMock.mockReturnValueOnce(new Promise(() => {}));

    renderWith(client, <StateProbe id="p2" />);

    expect(screen.getByText("cargando")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/projects/p2/state", expect.anything()),
    );
    expect(screen.queryByText(/Proyecto p1/)).not.toBeInTheDocument();
  });

  it("[ROS-81][003:FR-022] sin fuentes, la pestaña muestra el estado de proyecto sin fuentes", async () => {
    answer(stateOf("p1", []));

    renderWith(makeQueryClient(), <ProjectTabPlaceholder title={TAB_LABELS.catalog} />);

    expect(screen.getByRole("heading", { level: 1, name: "Catálogo" })).toBeInTheDocument();
    expect(await screen.findByText(projectsCopy.noEvidence)).toBeInTheDocument();
  });

  it("[ROS-81][003:FR-022] con fuentes, la pestaña dice que su pantalla aún no está disponible", async () => {
    answer(stateOf("p1", [ddl]));

    renderWith(makeQueryClient(), <ProjectTabPlaceholder title={TAB_LABELS.overview} />);

    expect(await screen.findByText("Panorama aún no está disponible.")).toBeInTheDocument();
    expect(screen.queryByText(projectsCopy.noEvidence)).not.toBeInTheDocument();
  });

  it("[ROS-81][003:FR-022] mientras carga no muestra ninguno de los dos estados", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));

    renderWith(makeQueryClient(), <ProjectTabPlaceholder title={TAB_LABELS.review} />);

    expect(screen.getByRole("heading", { level: 1, name: "Revisión" })).toBeInTheDocument();
    expect(screen.queryByText(projectsCopy.noEvidence)).not.toBeInTheDocument();
    expect(screen.queryByText(/aún no está disponible/)).not.toBeInTheDocument();
  });
});

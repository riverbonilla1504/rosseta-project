import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { projectsCopy } from "@/features/projects/copy";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { QueryProvider } from "@/lib/query-client";

/** contracts/ui-project-form.md de la feature 003. */
const summary = {
  id: "8d3f0c1e-2b4a-4c5d-9e6f-7a8b9c0d1e2f",
  name: "Ventas",
  description: "",
  source_dialect: "oracle",
  archived: false,
  archived_at: null,
  created_at: "2026-10-19T10:00:00Z",
  last_activity_at: "2026-10-19T10:00:00Z",
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

const fetchMock = vi.fn();

function renderForm(props: Partial<Parameters<typeof ProjectForm>[0]> = {}) {
  const onCreated = vi.fn();
  render(
    <QueryProvider>
      <ProjectForm onCreated={onCreated} {...props} />
    </QueryProvider>,
  );
  return { onCreated };
}

const nameInput = () => screen.getByLabelText(projectsCopy.nameLabel);
const submit = () => screen.getByRole("button", { name: projectsCopy.submit });

function fill(name: string, dialect?: "SQL Server" | "Oracle" | "PostgreSQL") {
  fireEvent.change(nameInput(), { target: { value: name } });
  if (dialect) fireEvent.click(screen.getByLabelText(dialect));
}

describe("formulario de creación de proyecto", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[ROS-78][003:FR-001] ofrece exactamente SQL Server, Oracle y PostgreSQL sin preselección", () => {
    renderForm();

    const group = screen.getByRole("radiogroup", { name: projectsCopy.dialectLabel });
    const options = screen.getAllByRole("radio");
    expect(group).toBeInTheDocument();
    expect(options.map((option) => option.getAttribute("value"))).toEqual([
      "tsql",
      "oracle",
      "postgres",
    ]);
    expect(options.map((option) => option.closest("label")?.textContent)).toEqual([
      "SQL Server",
      "Oracle",
      "PostgreSQL",
    ]);
    expect(options.every((option) => !(option as HTMLInputElement).checked)).toBe(true);
  });

  it("[ROS-78][003:FR-001] envía nombre y dialecto y llama a onCreated con el proyecto", async () => {
    fetchMock.mockResolvedValue(json(201, summary));
    const { onCreated } = renderForm();

    fill("  Ventas ", "Oracle");
    fireEvent.click(submit());

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(summary));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ name: "Ventas", source_dialect: "oracle" });
  });

  it.each([
    ["", projectsCopy.nameRequired],
    ["    ", projectsCopy.nameRequired],
    ["a".repeat(121), projectsCopy.nameTooLong],
  ])(
    "[ROS-78][003:FR-003] nombre inválido (%j): no envía, error junto al campo y foco en él",
    async (name, message) => {
      renderForm();

      fill(name, "SQL Server");
      fireEvent.click(submit());

      const error = await screen.findByText(message);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(nameInput()).toHaveAttribute("aria-invalid", "true");
      expect(nameInput()).toHaveAccessibleDescription(message);
      expect(error).toHaveAttribute("role", "alert");
      expect(nameInput()).toHaveFocus();
    },
  );

  it("[ROS-78][003:FR-003] sin dialecto: no envía, error anunciado y foco en la primera opción", async () => {
    renderForm();

    fill("Ventas");
    fireEvent.click(submit());

    const error = await screen.findByText(projectsCopy.dialectRequired);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(error).toHaveAttribute("role", "alert");
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      projectsCopy.dialectRequired,
    );
    expect(screen.getByLabelText("SQL Server")).toHaveFocus();
    expect(nameInput()).toHaveValue("Ventas");
  });

  it("[ROS-78][003:FR-003] con los dos campos mal, el foco va al primero (el nombre)", async () => {
    renderForm();

    fireEvent.click(submit());

    await screen.findByText(projectsCopy.dialectRequired);
    expect(screen.getByText(projectsCopy.nameRequired)).toBeInTheDocument();
    expect(nameInput()).toHaveFocus();
  });

  it("[ROS-78][003:FR-003] un solo envío en curso: el botón queda deshabilitado hasta la respuesta", async () => {
    let resolve: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((done) => (resolve = done)));
    const { onCreated } = renderForm();

    fill("Ventas", "Oracle");
    fireEvent.click(submit());
    await waitFor(() => expect(submit()).toBeDisabled());
    fireEvent.click(submit());
    fireEvent.submit(submit().closest("form")!);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => resolve(json(201, summary)));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it("[ROS-78][003:FR-004] nombre repetido del servidor: error junto al nombre y se conserva lo escrito", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: {
          code: "project_name_taken",
          message: "x",
          details: { name: ["x"] },
        },
      }),
    );
    const { onCreated } = renderForm();

    fill("Ventas", "Oracle");
    fireEvent.click(submit());

    expect(await screen.findByText(projectsCopy.nameTaken)).toHaveAttribute("role", "alert");
    expect(nameInput()).toHaveValue("Ventas");
    expect(nameInput()).toHaveFocus();
    expect(screen.getByLabelText("Oracle")).toBeChecked();
    expect(submit()).toBeEnabled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("[ROS-78][003:FR-003] validation_error del servidor: error junto al campo indicado en details", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: {
          code: "validation_error",
          message: "x",
          details: { source_dialect: ["x"] },
        },
      }),
    );
    renderForm();

    fill("Ventas", "Oracle");
    fireEvent.click(submit());

    expect(await screen.findByText(projectsCopy.dialectRequired)).toBeInTheDocument();
    expect(nameInput()).toHaveValue("Ventas");
  });

  it.each([
    ["error del servidor", () => fetchMock.mockResolvedValue(json(500, {}))],
    ["fallo de red", () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))],
  ])(
    "[ROS-78][003:FR-003] %s: error genérico, se conserva lo escrito y no reintenta solo",
    async (_case, arrange) => {
      arrange();
      const { onCreated } = renderForm();

      fill("Ventas", "PostgreSQL");
      fireEvent.click(submit());

      expect(await screen.findByText(projectsCopy.genericError)).toHaveAttribute("role", "alert");
      expect(nameInput()).toHaveValue("Ventas");
      expect(screen.getByLabelText("PostgreSQL")).toBeChecked();
      expect(submit()).toBeEnabled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onCreated).not.toHaveBeenCalled();
    },
  );

  it("[ROS-78][003:FR-002] el texto del botón se puede cambiar sin cambiar las reglas", () => {
    renderForm({ submitLabel: "Otro texto" });

    expect(screen.getByRole("button", { name: "Otro texto" })).toBeInTheDocument();
  });

  it("[ROS-78][003:FR-029] etiquetas asociadas y orden del foco igual al visual", () => {
    renderForm();

    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>("input, button, select, textarea"),
    );
    expect(focusable.map((element) => element.getAttribute("name") ?? element.tagName)).toEqual([
      "name",
      "source_dialect",
      "source_dialect",
      "source_dialect",
      "BUTTON",
    ]);
    expect(focusable.every((element) => !element.hasAttribute("tabindex"))).toBe(true);
    expect(nameInput()).toHaveAttribute("maxlength", "120");
  });
});

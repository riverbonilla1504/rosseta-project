import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Onboarding de un paso (T051 de la feature 002; FR-017, FR-019, FR-020): bienvenida con el
 * nombre, el formulario de proyecto de la feature 003 (aquí simulado) y, al crear el proyecto,
 * POST /api/me/onboarding/complete y /projects. Datos sintéticos.
 */
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const getCurrentUser = vi.fn();
vi.mock("@/features/auth/currentUser", () => ({ getCurrentUser }));

const created = { id: "p1", name: "CORE_PRD", source_dialect: "tsql" };
const formProps = vi.fn();
vi.mock("@/features/projects/ProjectForm", () => ({
  ProjectForm: (props: {
    onCreated: (project: unknown) => Promise<void>;
    submitLabel?: string;
  }) => {
    formProps(props);
    return (
      <form aria-label="formulario de proyecto simulado">
        <button type="button" onClick={() => void props.onCreated(created).catch(() => {})}>
          crear (simulado)
        </button>
      </form>
    );
  },
}));

const { OnboardingFlow } = await import("@/features/onboarding/OnboardingFlow");
const { default: OnboardingPage } = await import("@/app/(app)/onboarding/page");

const fetchMock = vi.fn();

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("onboarding", () => {
  beforeEach(() => {
    push.mockClear();
    formProps.mockClear();
    fetchMock.mockReset();
    getCurrentUser.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("[ROS-91][002:FR-019] da la bienvenida por el nombre con el texto de DP-025", () => {
    render(<OnboardingFlow name="Ana" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hola, Ana. Crea tu primer proyecto para empezar.",
    );
  });

  it("[ROS-91][002:FR-019][002:FR-020] un solo paso: el formulario de proyecto y ninguna carga de DDL", () => {
    const { container } = render(<OnboardingFlow name="Ana" />);

    expect(screen.getAllByRole("form")).toHaveLength(1);
    expect(formProps).toHaveBeenCalled();
    expect(formProps.mock.calls[0][0].submitLabel).toBeUndefined();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText(/DDL|paso \d/i)).not.toBeInTheDocument();
  });

  it("[ROS-91][002:FR-019] al crear el proyecto completa el onboarding y lleva a /projects", async () => {
    answer(200, { onboarding_completed: true });
    render(<OnboardingFlow name="Ana" />);

    fireEvent.click(screen.getByRole("button", { name: "crear (simulado)" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/me/onboarding/complete");
    expect(init.method).toBe("POST");
  });

  it("[ROS-91][002:FR-019] si no se crea el proyecto no se completa el onboarding", () => {
    render(<OnboardingFlow name="Ana" />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("[ROS-91][002:FR-019] si completar falla, no navega y el error llega al formulario", async () => {
    answer(503, { error: { code: "backend_unavailable", message: "x", details: {} } });
    render(<OnboardingFlow name="Ana" />);

    await expect(formProps.mock.calls[0][0].onCreated(created)).rejects.toThrow();
    expect(push).not.toHaveBeenCalled();
  });

  it("[ROS-91][002:FR-017][002:FR-019] la página pasa el nombre de la cuenta al onboarding", async () => {
    getCurrentUser.mockResolvedValue({
      status: "ok",
      user: {
        id: "u1",
        email: "ana@example.test",
        full_name: "Ana Prueba",
        avatar_url: null,
        onboarding_completed: false,
      },
    });

    render(await OnboardingPage());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hola, Ana Prueba.");
  });
});

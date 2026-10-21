import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect }));

let currentPath = "/projects";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-rosetta-pathname": currentPath }),
}));

const getCurrentUser = vi.fn();
vi.mock("@/features/auth/currentUser", () => ({ getCurrentUser }));

const { default: AppLayout } = await import("@/app/(app)/layout");

const account = (onboarding_completed: boolean) => ({
  status: "ok" as const,
  user: {
    id: "u1",
    email: "a@example.test",
    full_name: "Ana",
    avatar_url: null,
    onboarding_completed,
  },
});

async function renderAt(path: string) {
  currentPath = path;
  render(await AppLayout({ children: <p>contenido privado</p> }));
}

async function redirectAt(path: string) {
  currentPath = path;
  await expect(AppLayout({ children: <p /> })).rejects.toThrow(/NEXT_REDIRECT/);
  return redirect.mock.calls.at(-1)?.[0];
}

describe("guarda de onboarding del área privada", () => {
  beforeEach(() => {
    redirect.mockClear();
    getCurrentUser.mockReset();
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
  });

  it.each(["/projects", "/p/1/sources"])(
    "[ROS-91][002:FR-018] onboarding pendiente: %s redirige a /onboarding",
    async (path) => {
      getCurrentUser.mockResolvedValue(account(false));

      expect(await redirectAt(path)).toBe("/onboarding");
    },
  );

  it("[ROS-91][002:FR-018] onboarding pendiente: /onboarding se muestra", async () => {
    getCurrentUser.mockResolvedValue(account(false));

    await renderAt("/onboarding");

    expect(screen.getByText("contenido privado")).toBeVisible();
  });

  it("[ROS-91][002:FR-021] onboarding completado: /onboarding redirige a /projects", async () => {
    getCurrentUser.mockResolvedValue(account(true));

    expect(await redirectAt("/onboarding")).toBe("/projects");
  });

  it("[ROS-91][002:FR-021] el estado se consulta a la cuenta en cada carga (no al dispositivo)", async () => {
    getCurrentUser.mockResolvedValueOnce(account(false)).mockResolvedValueOnce(account(true));

    expect(await redirectAt("/projects")).toBe("/onboarding");
    await renderAt("/projects");

    expect(getCurrentUser).toHaveBeenCalledTimes(2);
    expect(screen.getByText("contenido privado")).toBeVisible();
  });

  it("[ROS-92][002:FR-025] toda pantalla privada ofrece cerrar sesión hacia la URL absoluta de /login", async () => {
    getCurrentUser.mockResolvedValue(account(true));

    await renderAt("/projects");

    expect(screen.getByRole("link", { name: "Cerrar sesión" })).toHaveAttribute(
      "href",
      `/auth/logout?returnTo=${encodeURIComponent("http://localhost:3000/login")}`,
    );
  });

  it("[ROS-89][002:FR-014] sin sesión → /login?returnTo=<ruta>; cuenta rechazada → /auth/denied", async () => {
    getCurrentUser.mockResolvedValue({ status: "unauthenticated" });
    expect(await redirectAt("/projects")).toBe("/login?returnTo=%2Fprojects");

    getCurrentUser.mockResolvedValue({ status: "denied", code: "account_disabled" });
    expect(await redirectAt("/projects")).toBe("/auth/denied?code=account_disabled");
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let cookieValues: Record<string, string> = {};
let requestHeaders: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name in cookieValues ? { name, value: cookieValues[name] } : undefined),
  }),
  headers: async () => new Headers(requestHeaders),
}));

const { default: AuthErrorPage } = await import("@/app/(public)/auth/error/page");

async function renderError(params: Record<string, string> = {}) {
  render(await AuthErrorPage({ searchParams: Promise.resolve(params) }));
}

const message = () => screen.getByRole("alert");
const retry = () => screen.getByRole("link", { name: "Volver a intentar" });

describe("pantalla de error de acceso /auth/error", () => {
  beforeEach(() => {
    cookieValues = { rosetta_login_provider: "google" };
    requestHeaders = {};
  });

  it("[ROS-90][002:FR-036] oauth_denied: cancelaste con {proveedor} (de la cookie)", async () => {
    await renderError({ code: "oauth_denied" });

    expect(message()).toHaveTextContent(
      "Cancelaste el inicio de sesión con Google. Puedes intentarlo de nuevo cuando quieras.",
    );
  });

  it("[ROS-90][002:FR-037] oauth_failed: el proveedor no respondió", async () => {
    cookieValues = { rosetta_login_provider: "microsoft" };
    await renderError({ code: "oauth_failed" });

    expect(message()).toHaveTextContent(
      "Microsoft no respondió. Intenta en unos minutos o usa otro proveedor.",
    );
  });

  it.each([
    ["email_not_verified", "Google no confirma que tu correo esté verificado."],
    ["email_missing", "Google no compartió tu correo y lo necesitamos para crear tu cuenta."],
    [
      "account_exists_other_provider",
      "Ya existe una cuenta con ese correo, creada con otro proveedor.",
    ],
    ["account_disabled", "Tu cuenta está desactivada."],
  ])("[ROS-90][002:FR-038] %s tiene su propio mensaje", async (code, text) => {
    await renderError({ code });

    expect(message()).toHaveTextContent(text);
  });

  it("[ROS-90][002:FR-038] sin código: error genérico", async () => {
    await renderError();

    expect(message()).toHaveTextContent(
      "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
    );
  });

  it("[ROS-90][002:FR-036] un código desconocido se trata como oauth_failed", async () => {
    await renderError({ code: "<script>" });

    expect(message()).toHaveTextContent("Google no respondió.");
  });

  it.each([{}, { rosetta_login_provider: "facebook" }])(
    "[ROS-90][002:FR-036] sin cookie de proveedor válida usa la forma genérica (%j)",
    async (cookies) => {
      cookieValues = cookies;
      await renderError({ code: "oauth_denied" });

      expect(message()).toHaveTextContent(
        "Cancelaste el inicio de sesión con tu proveedor de acceso.",
      );
    },
  );

  it("[ROS-90][002:FR-039] Volver a intentar lleva a /login conservando solo un returnTo interno", async () => {
    await renderError({ code: "oauth_denied", returnTo: "/projects" });
    expect(retry()).toHaveAttribute("href", "/login?returnTo=%2Fprojects");
  });

  it("[ROS-90][002:FR-039] un returnTo externo se descarta", async () => {
    await renderError({ code: "oauth_denied", returnTo: "https://evil.example" });
    expect(retry()).toHaveAttribute("href", "/login");
  });

  it("[ROS-90][002:FR-009] el código de la cookie rosetta_auth_error (lo consume el middleware) tiene prioridad", async () => {
    requestHeaders = { "x-rosetta-auth-error": "account_disabled" };
    await renderError({ code: "oauth_failed" });

    expect(message()).toHaveTextContent("Tu cuenta está desactivada.");
  });

  it("[ROS-90][002:FR-039] siempre hay una salida", async () => {
    await renderError({ code: "account_disabled" });
    expect(retry()).toBeVisible();
  });
});

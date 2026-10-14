import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import LoginPage from "@/app/(public)/login/page";

async function renderLogin(params: Record<string, string> = {}) {
  render(await LoginPage({ searchParams: Promise.resolve(params) }));
}

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

describe("pantalla de acceso /login", () => {
  beforeEach(() => {
    clearCookies();
  });

  it("[ROS-90][002:FR-002] ofrece exactamente dos acciones: Google y Microsoft", async () => {
    await renderLogin();

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Continuar con Google",
      "Continuar con Microsoft",
    ]);
  });

  it("[ROS-90][002:FR-001] no tiene campo de contraseña ni registro por correo", async () => {
    await renderLogin();

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(screen.queryByText(/contraseña/i)).toBeNull();
  });

  it("[ROS-90][002:FR-002] muestra la nota de privacidad (qué datos se piden y para qué)", async () => {
    await renderLogin();

    expect(
      screen.getByText(/nombre, correo y foto de perfil solo para identificarte/i),
    ).toBeVisible();
  });

  it("[ROS-90][002:FR-003] cada acción va a /auth/login con su conexión y el returnTo interno", async () => {
    await renderLogin({ returnTo: "/projects" });

    const google = screen.getByRole("link", { name: "Continuar con Google" });
    const microsoft = screen.getByRole("link", { name: "Continuar con Microsoft" });
    expect(google).toHaveAttribute(
      "href",
      "/auth/login?connection=google-oauth2&returnTo=%2Fprojects",
    );
    expect(microsoft).toHaveAttribute(
      "href",
      "/auth/login?connection=windowslive&returnTo=%2Fprojects",
    );
  });

  it("[ROS-93][002:FR-015] un returnTo externo se descarta y se usa el destino por defecto", async () => {
    await renderLogin({ returnTo: "https://evil.example/phish" });

    expect(screen.getByRole("link", { name: "Continuar con Google" })).toHaveAttribute(
      "href",
      "/auth/login?connection=google-oauth2&returnTo=%2F",
    );
  });

  it.each([
    ["Continuar con Google", "google"],
    ["Continuar con Microsoft", "microsoft"],
  ])(
    "[ROS-90][002:FR-036] al pulsar %s se guarda la cookie rosetta_login_provider=%s",
    async (name, provider) => {
      await renderLogin();
      const link = screen.getByRole("link", { name });
      link.addEventListener("click", (event) => event.preventDefault());

      fireEvent.click(link);

      expect(document.cookie).toContain(`rosetta_login_provider=${provider}`);
    },
  );

  it("[ROS-90][002:FR-040] las acciones son navegables con teclado (enlaces con href, sin tabindex negativo)", async () => {
    await renderLogin();

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href");
      expect(link.getAttribute("tabindex")).not.toBe("-1");
    }
  });
});

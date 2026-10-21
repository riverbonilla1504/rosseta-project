import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppError from "@/app/error";

describe("página de error de la app (error.tsx)", () => {
  it("[ROS-90][002:FR-039] muestra el error genérico con una salida y nunca deja la página en blanco", () => {
    render(<AppError error={new Error("GET /api/me respondió 503")} reset={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
    );
    expect(screen.getByRole("link", { name: "Volver a intentar" })).toHaveAttribute("href", "/");
  });

  it("[ROS-93][002:FR-033] no muestra el detalle interno del error", () => {
    render(
      <AppError error={new Error("token eyJabc.def.ghi de ana@example.test")} reset={vi.fn()} />,
    );

    expect(document.body.textContent).not.toContain("eyJ");
    expect(document.body.textContent).not.toContain("example.test");
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { projectsCopy } from "@/features/projects/copy";

/** Navegación del proyecto (FR-007 de la feature 003, DP-017) y pestañas vacías (R-14). */
let pathname = "/p/p1";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { ProjectTabs } = await import("@/features/projects/ProjectTabs");
const { default: OverviewPage } = await import("@/app/(app)/p/[projectId]/page");
const { default: ReviewPage } = await import("@/app/(app)/p/[projectId]/review/page");
const { default: CatalogPage } = await import("@/app/(app)/p/[projectId]/catalog/page");
const { default: SourcesPage } = await import("@/app/(app)/p/[projectId]/sources/page");

describe("pestañas del proyecto", () => {
  it("[ROS-78][003:FR-007] Panorama, Revisión, Catálogo y Fuentes, en ese orden; sin Hallazgos ni Generador", () => {
    render(<ProjectTabs projectId="p1" />);

    const nav = screen.getByRole("navigation");
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Panorama", "/p/p1"],
      ["Revisión", "/p/p1/review"],
      ["Catálogo", "/p/p1/catalog"],
      ["Fuentes", "/p/p1/sources"],
    ]);
    expect(screen.queryByText(/Hallazgos|Generador/)).not.toBeInTheDocument();
  });

  it.each([
    ["/p/p1", "Panorama"],
    ["/p/p1/review", "Revisión"],
    ["/p/p1/catalog", "Catálogo"],
    ["/p/p1/sources", "Fuentes"],
  ])("[ROS-78][003:FR-007] en %s la pestaña activa es %s", (path, active) => {
    pathname = path;
    render(<ProjectTabs projectId="p1" />);

    const current = screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"));
    expect(current.map((link) => link.textContent)).toEqual([active]);
    expect(current[0]).toHaveAttribute("aria-current", "page");
  });

  it.each([
    ["Panorama", OverviewPage],
    ["Revisión", ReviewPage],
    ["Catálogo", CatalogPage],
    ["Fuentes", SourcesPage],
  ])(
    "[ROS-78][003:FR-007] %s muestra el estado de proyecto sin fuentes (04-contenido §5)",
    (title, Page) => {
      render(<Page />);

      expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      expect(screen.getByText(projectsCopy.noEvidence)).toBeInTheDocument();
    },
  );
});

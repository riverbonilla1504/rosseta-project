import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";
import { makeQueryClient, QueryProvider } from "@/lib/query-client";

function Capture({ into }: { into: QueryClient[] }) {
  into.push(useQueryClient());
  return null;
}

describe("estado del servidor en el cliente (research R-13)", () => {
  it("[ROS-78][003:FR-009] el área privada ofrece un QueryClient estable durante la vida de la pestaña", () => {
    const seen: QueryClient[] = [];
    const { rerender } = render(
      <QueryProvider>
        <Capture into={seen} />
      </QueryProvider>,
    );
    rerender(
      <QueryProvider>
        <Capture into={seen} />
      </QueryProvider>,
    );

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
  });

  it("[ROS-78][003:FR-009] dos pestañas (dos montajes) no comparten caché", () => {
    const first: QueryClient[] = [];
    const second: QueryClient[] = [];
    render(
      <QueryProvider>
        <Capture into={first} />
      </QueryProvider>,
    );
    render(
      <QueryProvider>
        <Capture into={second} />
      </QueryProvider>,
    );

    expect(first[0]).not.toBe(second[0]);
  });

  it("[ROS-78][003:FR-009] las mutaciones nunca se reintentan solas", () => {
    expect(makeQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });

  it("[ROS-78][003:FR-009] una consulta no reintenta errores definitivos (401, 404) y sí uno recuperable", () => {
    const retry = makeQueryClient().getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe("function");
    const decide = retry as (count: number, error: unknown) => boolean;

    expect(decide(0, new ApiError(401, "session_expired", false))).toBe(false);
    expect(decide(0, new ApiError(404, "not_found", false))).toBe(false);
    expect(decide(0, new ApiError(503, "identity_unavailable", true))).toBe(true);
    expect(decide(2, new ApiError(503, "identity_unavailable", true))).toBe(false);
  });
});

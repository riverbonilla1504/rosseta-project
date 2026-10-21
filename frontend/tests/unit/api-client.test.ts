import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { ApiError, apiFetch } from "@/lib/api/client";

let fetchMock: Mock<typeof fetch>;
let navigate: Mock<(url: string) => void>;

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorBody(code: string) {
  return { error: { code, message: "x", details: {} } };
}

describe("apiFetch (cliente del navegador hacia /api)", () => {
  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    navigate = vi.fn<(url: string) => void>();
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState(null, "", "/p/123/sources?tab=ddl");
  });

  it("[ROS-92][002:FR-026] 401 session_expired → /login?returnTo=<ruta actual>&notice=session_expired", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, errorBody("session_expired")));

    await expect(apiFetch("/api/me", {}, { navigate })).rejects.toBeInstanceOf(ApiError);

    const target = new URL(navigate.mock.calls[0][0], "http://localhost");
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("returnTo")).toBe("/p/123/sources?tab=ddl");
    expect(target.searchParams.get("notice")).toBe("session_expired");
  });

  it("[ROS-92][002:FR-026] 503 identity_unavailable no cierra la sesión: error recuperable sin navegar", async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, errorBody("identity_unavailable")));

    const error = await apiFetch("/api/me", {}, { navigate }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("identity_unavailable");
    expect((error as ApiError).retryable).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("[ROS-92][002:FR-026] una operación interrumpida no se reintenta sola (no se aplica a medias)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, errorBody("session_expired")));

    await apiFetch("/api/projects", { method: "POST", body: "{}" }, { navigate }).catch(() => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("[ROS-92][002:FR-022] respuesta correcta → devuelve el JSON y envía las cookies del mismo origen", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "u1" }));

    await expect(apiFetch("/api/me", {}, { navigate })).resolves.toEqual({ id: "u1" });
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("same-origin");
  });
});

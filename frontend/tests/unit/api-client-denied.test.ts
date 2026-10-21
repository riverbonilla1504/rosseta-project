import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { ApiError, apiFetch } from "@/lib/api/client";

let fetchMock: Mock<typeof fetch>;
let navigate: Mock<(url: string) => void>;

function rejection(code: string) {
  return new Response(JSON.stringify({ error: { code, message: "x", details: {} } }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

describe("apiFetch ante una cuenta rechazada", () => {
  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    navigate = vi.fn<(url: string) => void>();
    vi.stubGlobal("fetch", fetchMock);
  });

  it.each([
    "account_disabled",
    "account_exists_other_provider",
    "email_missing",
    "email_not_verified",
  ])("[ROS-90][002:FR-039] 403 %s → /auth/denied?code=… sin reintentar", async (code) => {
    fetchMock.mockResolvedValue(rejection(code));

    await expect(apiFetch("/api/me", {}, { navigate })).rejects.toBeInstanceOf(ApiError);

    expect(navigate).toHaveBeenCalledWith(`/auth/denied?code=${code}`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("[ROS-89][002:FR-011] otro 403 (forbidden_origin) no navega", async () => {
    fetchMock.mockResolvedValue(rejection("forbidden_origin"));

    await apiFetch("/api/me", {}, { navigate }).catch(() => {});

    expect(navigate).not.toHaveBeenCalled();
  });
});

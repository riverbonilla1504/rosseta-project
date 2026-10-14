// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { createProxyHandler, type ProxyLogEntry } from "@/lib/api/proxy";

describe("registro del proxy BFF (FR-033)", () => {
  it("[ROS-93][002:FR-033] solo registra método, ruta sin consulta, estado, duración y request_id", async () => {
    const entries: ProxyLogEntry[] = [];
    const handler = createProxyHandler({
      appBaseUrl: "http://localhost:3000",
      backendUrl: "http://backend.internal:8000",
      getAccessToken: async () => "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.firma",
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ email: "ana@example.test", full_name: "Ana" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
      log: (entry) => entries.push(entry),
    });

    await handler(
      new Request("http://localhost:3000/api/me?email=ana%40example.test&token=secreto", {
        headers: {
          cookie: "__session=abc",
          authorization: "Bearer del-navegador",
          "x-request-id": "rid-7",
        },
      }),
    );

    expect(entries).toHaveLength(1);
    const [entry] = entries;
    expect(Object.keys(entry).sort()).toEqual([
      "durationMs",
      "method",
      "path",
      "requestId",
      "status",
    ]);
    expect(entry).toMatchObject({
      method: "GET",
      path: "/api/me",
      status: 200,
      requestId: "rid-7",
    });
    const serialized = JSON.stringify(entry);
    for (const secret of ["eyJ", "ana", "example.test", "secreto", "__session", "Bearer", "Ana"]) {
      expect(serialized).not.toContain(secret);
    }
  });
});

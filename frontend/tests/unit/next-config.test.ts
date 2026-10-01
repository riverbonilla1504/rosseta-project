import { describe, expect, it } from "vitest";

import { backendRewrites } from "../../next.config";

describe("proxy /api y /auth al backend (ADR-0006)", () => {
  it("reenvía /api y /auth al backend configurado", () => {
    expect(backendRewrites("http://backend:8000")).toEqual([
      { source: "/api/:path*", destination: "http://backend:8000/api/:path*" },
      { source: "/auth/:path*", destination: "http://backend:8000/auth/:path*" },
    ]);
  });

  it("tolera una barra final en la URL del backend", () => {
    expect(backendRewrites("http://backend:8000/")[0].destination).toBe(
      "http://backend:8000/api/:path*",
    );
  });
});

describe("configuración de Next.js", () => {
  it("usa BACKEND_INTERNAL_URL y aplica los rewrites", async () => {
    process.env.BACKEND_INTERNAL_URL = "http://api.interno:8000";
    const { default: nextConfig } = await import("../../next.config");

    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual(backendRewrites("http://api.interno:8000"));
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});

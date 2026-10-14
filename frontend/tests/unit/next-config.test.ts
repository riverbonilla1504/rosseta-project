import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "../../next.config";

async function headersFor(nodeEnv: string) {
  vi.stubEnv("NODE_ENV", nodeEnv);
  const rules = (await nextConfig.headers?.()) ?? [];
  const all = rules.find((rule) => rule.source === "/:path*");
  return Object.fromEntries((all?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]));
}

describe("configuración de Next.js (D6 y cabeceras de seguridad)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[ROS-93][002:FR-034] no reescribe /api ni /auth hacia el backend (D6: lo hace el proxy BFF y el SDK)", () => {
    expect(nextConfig.rewrites).toBeUndefined();
  });

  it("[ROS-93][002:FR-034] no anuncia la tecnología del servidor", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("[ROS-93][002:FR-034] toda respuesta lleva X-Frame-Options, nosniff y Referrer-Policy", async () => {
    const headers = await headersFor("development");

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("[ROS-93][002:FR-034] Strict-Transport-Security solo en producción", async () => {
    expect((await headersFor("development"))["strict-transport-security"]).toBeUndefined();
    expect((await headersFor("production"))["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });
});

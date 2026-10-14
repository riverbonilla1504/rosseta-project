import { describe, expect, it } from "vitest";

import { buildAuth0Options } from "@/lib/auth0-config";

const baseEnv = {
  NODE_ENV: "development",
  APP_BASE_URL: "http://localhost:3000",
  AUTH0_DOMAIN: "tenant.example.test",
  AUTH0_CLIENT_ID: "client-id",
  AUTH0_CLIENT_SECRET: "client-secret",
  AUTH0_SECRET: "0".repeat(64),
  AUTH0_AUDIENCE: "https://api.rosetta.local",
} as const;

describe("configuración del SDK de Auth0", () => {
  it("[ROS-92][002:FR-024] sesión deslizante de 14 días y máxima de 30 (PROVISIONAL DP-022)", () => {
    const { session } = buildAuth0Options(baseEnv);

    expect(session?.rolling).toBe(true);
    expect(session?.inactivityDuration).toBe(1_209_600);
    expect(session?.absoluteDuration).toBe(2_592_000);
  });

  it("[ROS-93][002:FR-027] pide solo openid profile email offline_access para la audiencia de Rosetta API", () => {
    const { authorizationParameters, signInReturnToPath } = buildAuth0Options(baseEnv);

    expect(authorizationParameters?.scope).toBe("openid profile email offline_access");
    expect(authorizationParameters?.audience).toBe("https://api.rosetta.local");
    expect(signInReturnToPath).toBe("/");
  });

  it("[ROS-92][002:FR-030] cookie de sesión SameSite=Lax y Secure salvo en desarrollo local", () => {
    const local = buildAuth0Options(baseEnv);
    const prod = buildAuth0Options({
      ...baseEnv,
      NODE_ENV: "production",
      APP_BASE_URL: "https://rosetta.example.test",
    });

    expect(local.session?.cookie?.sameSite).toBe("lax");
    expect(local.session?.cookie?.secure).toBe(false);
    expect(prod.session?.cookie?.sameSite).toBe("lax");
    expect(prod.session?.cookie?.secure).toBe(true);
    expect(prod.transactionCookie?.secure).toBe(true);
  });

  it("[ROS-93][002:FR-027] una solicitud de acceso iniciada caduca a los 600 s", () => {
    expect(buildAuth0Options(baseEnv).transactionCookie?.maxAge).toBe(600);
  });

  it("[ROS-93][002:FR-030] allowInsecureRequests solo con E2E_ALLOW_INSECURE_IDP=1 y nunca en producción", () => {
    expect(buildAuth0Options(baseEnv).allowInsecureRequests).toBe(false);
    expect(
      buildAuth0Options({ ...baseEnv, E2E_ALLOW_INSECURE_IDP: "1" }).allowInsecureRequests,
    ).toBe(true);
    expect(
      buildAuth0Options({ ...baseEnv, NODE_ENV: "production", E2E_ALLOW_INSECURE_IDP: "1" })
        .allowInsecureRequests,
    ).toBe(false);
  });

  it("[ROS-93][002:FR-030] el navegador no puede pedir el access token (/auth/access-token desactivado)", () => {
    expect(buildAuth0Options(baseEnv).enableAccessTokenEndpoint).toBe(false);
  });
});

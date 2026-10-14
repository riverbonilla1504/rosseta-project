import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de la feature 002 contra un proveedor de identidad simulado (research R-13).
 * Levanta tres procesos: el proveedor simulado, el backend (con AUTH0_ISSUER y AUTH0_JWKS_URL
 * hacia el simulado, solo fuera de producción) y el frontend (con E2E_ALLOW_INSECURE_IDP=1).
 * Puertos propios para no chocar con el entorno de desarrollo (3000/8000).
 */
const MOCK_IDP_PORT = 4010;
const BACKEND_PORT = 8001;
const FRONTEND_PORT = 3100;
const MOCK_IDP_URL = `http://localhost:${MOCK_IDP_PORT}`;
const APP_BASE_URL = `http://localhost:${FRONTEND_PORT}`;
const AUDIENCE = "https://api.rosetta.local";
const UV = process.env.E2E_UV ?? "uv run";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // El proveedor simulado tiene un estado global (identidad, próximo /authorize): un solo worker.
  workers: 1,
  // La primera compilación de cada ruta en next dev puede pasar de 30 s.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: APP_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/e2e/support/mock-idp-server.mjs",
      url: `${MOCK_IDP_URL}/.well-known/openid-configuration`,
      env: {
        MOCK_IDP_PORT: String(MOCK_IDP_PORT),
        MOCK_IDP_AUDIENCE: AUDIENCE,
        MOCK_IDP_APP_BASE_URL: APP_BASE_URL,
      },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `${UV} python manage.py runserver ${BACKEND_PORT} --noreload`,
      cwd: "../backend",
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      env: {
        DJANGO_SETTINGS_MODULE: "config.settings.dev",
        DJANGO_SECRET_KEY: process.env.DJANGO_SECRET_KEY ?? "e2e-only-not-secret",
        DATABASE_URL:
          process.env.DATABASE_URL ?? "postgres://rosetta:rosetta_dev_only@localhost:5433/rosetta",
        AUTH0_DOMAIN: `localhost:${MOCK_IDP_PORT}`,
        AUTH0_AUDIENCE: AUDIENCE,
        AUTH0_ISSUER: `${MOCK_IDP_URL}/`, // el SDK y el mock usan el emisor con barra final, como Auth0
        AUTH0_JWKS_URL: `${MOCK_IDP_URL}/jwks`,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm exec next dev -p ${FRONTEND_PORT}`,
      url: APP_BASE_URL,
      env: {
        APP_BASE_URL,
        AUTH0_DOMAIN: MOCK_IDP_URL,
        AUTH0_CLIENT_ID: "e2e-client",
        AUTH0_CLIENT_SECRET: "e2e-only-not-secret",
        AUTH0_SECRET: "0".repeat(64),
        AUTH0_AUDIENCE: AUDIENCE,
        BACKEND_INTERNAL_URL: `http://localhost:${BACKEND_PORT}`,
        E2E_ALLOW_INSECURE_IDP: "1",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});

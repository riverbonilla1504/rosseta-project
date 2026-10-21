import { auth0 } from "@/lib/auth0";
import { classifyTokenError, createProxyHandler } from "@/lib/api/proxy";

/** Proxy BFF /api/* → Django con el access token del SDK (ROS-188, contracts/bff-proxy.md). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxy = createProxyHandler({
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  backendUrl: process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000",
  async getAccessToken() {
    try {
      // Renueva en silencio si el access token venció (FR-022).
      const { token } = await auth0.getAccessToken();
      return token;
    } catch (error) {
      throw classifyTokenError(error);
    }
  },
  // Solo método, ruta sin consulta, estado, duración y request_id (FR-033).
  log: (entry) => console.info(JSON.stringify({ event: "api_proxy", ...entry })),
});

export async function GET(request: Request) {
  return proxy(request);
}
export async function POST(request: Request) {
  return proxy(request);
}
export async function PATCH(request: Request) {
  return proxy(request);
}
export async function PUT(request: Request) {
  return proxy(request);
}
export async function DELETE(request: Request) {
  return proxy(request);
}

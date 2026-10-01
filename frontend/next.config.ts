import type { NextConfig } from "next";

/**
 * El navegador solo habla con el origen de Next.js; /api y /auth se reenvían al backend
 * para que las cookies sean de primer origen y no haga falta CORS (ADR-0006).
 */
export function backendRewrites(
  backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000",
) {
  const base = backendUrl.replace(/\/+$/, "");
  return [
    { source: "/api/:path*", destination: `${base}/api/:path*` },
    { source: "/auth/:path*", destination: `${base}/auth/:path*` },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Django no usa barra final en /api/health; evitar redirecciones 308 de Next.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return backendRewrites();
  },
};

export default nextConfig;

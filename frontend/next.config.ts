import type { NextConfig } from "next";

/**
 * Sin rewrites hacia el backend (ADR-0007, D6 del plan de 002): /api/* lo atiende el proxy
 * BFF (src/app/api/[...path]/route.ts), que añade el access token, y /auth/* lo monta el SDK
 * de Auth0 en el middleware. Un rewrite de /api saltaría el proxy.
 *
 * Cabeceras estáticas de 07-seguridad §5 (FR-034); la CSP con nonce la pone el middleware.
 */
function securityHeaders(isProduction: boolean) {
  const headers = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }
  return headers;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Django no usa barra final en /api/health; evitar redirecciones 308 de Next.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders(process.env.NODE_ENV === "production") }];
  },
};

export default nextConfig;

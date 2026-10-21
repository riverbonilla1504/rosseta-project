/**
 * Content-Security-Policy de Next.js con nonce por petición (07-seguridad §5, research R-10).
 * Implementa FR-034 (ROS-93). Sin `script-src` explícito Next no ejecutaría sus scripts en
 * línea; con nonce y 'strict-dynamic' no hace falta 'unsafe-inline' en scripts.
 */
export function buildCsp(nonce: string, isDevelopment: boolean): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDevelopment) scriptSrc.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "img-src 'self' data: https://lh3.googleusercontent.com https://s.gravatar.com https://*.auth0.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

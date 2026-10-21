/**
 * Destino de regreso tras el acceso: solo rutas internas de Rosetta (FR-015, ROS-93).
 * Cualquier otro valor se ignora y se usa la raíz, que resuelve onboarding o proyectos.
 */
export const DEFAULT_RETURN_TO = "/";

const BASE = "http://rosetta.invalid";
const MAX_DECODE_ROUNDS = 3;

function looksUnsafe(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return true;
  // Espacios, barras invertidas y caracteres de control nunca forman parte de una ruta segura.
  if (/[\s\\\x00-\x1f\x7f]/.test(path)) return true;
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname.split("/").some((segment) => segment === "..");
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || value === "") return DEFAULT_RETURN_TO;

  let candidate = value;
  for (let round = 0; round <= MAX_DECODE_ROUNDS; round += 1) {
    if (looksUnsafe(candidate)) return DEFAULT_RETURN_TO;
    let decoded: string;
    try {
      decoded = decodeURIComponent(candidate);
    } catch {
      return DEFAULT_RETURN_TO;
    }
    if (decoded === candidate) break;
    candidate = decoded;
  }

  try {
    if (new URL(value, BASE).origin !== BASE) return DEFAULT_RETURN_TO;
  } catch {
    return DEFAULT_RETURN_TO;
  }
  return value;
}

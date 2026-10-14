/**
 * Textos de acceso y onboarding (spec 002). Tuteo neutro (DP-009). Nunca dispersos en JSX.
 * - Los marcados "04-contenido §5" ya están definidos en docs/05-diseno/04-contenido-y-redaccion.md.
 * - Los marcados PROVISIONAL (DP-025) son las propuestas de esa decisión pendiente; T085 los
 *   sustituye cuando se aprueben.
 */
export const PROVIDER_NAMES = { google: "Google", microsoft: "Microsoft" } as const;
export type Provider = keyof typeof PROVIDER_NAMES;

export const copy = {
  brand: "Rosetta",
  // PROVISIONAL (DP-025)
  valuePhrase:
    "Rosetta reconstruye el significado de tu base de datos heredada, a partir de evidencia verificable.",
  continueWithGoogle: "Continuar con Google", // 03-pantallas §7
  continueWithMicrosoft: "Continuar con Microsoft", // 03-pantallas §7
  // PROVISIONAL (DP-025); {proveedor} con la forma genérica, porque aún no se eligió proveedor.
  privacyNote:
    "Usamos tu nombre, correo y foto de perfil solo para identificarte. No accedemos a nada más de tu cuenta de tu proveedor de acceso.",
  // PROVISIONAL (DP-025): forma genérica de {proveedor} cuando no se conoce.
  genericProvider: "tu proveedor de acceso",
  // 04-contenido §5
  sessionExpired: "Tu sesión terminó. Vuelve a iniciar sesión para continuar.",
} as const;

/**
 * Textos de acceso y onboarding (spec 002). Tuteo neutro (DP-009). Nunca dispersos en JSX.
 * - Los marcados "04-contenido §5" están definidos en docs/05-diseno/04-contenido-y-redaccion.md;
 *   los que además citan DP-025 se aprobaron en esa decisión (CD-012).
 */
export const PROVIDER_NAMES = { google: "Google", microsoft: "Microsoft" } as const;
export type Provider = keyof typeof PROVIDER_NAMES;

export const copy = {
  brand: "Rosetta",
  // 04-contenido §5 (DP-025)
  valuePhrase:
    "Rosetta reconstruye el significado de tu base de datos heredada, a partir de evidencia verificable.",
  continueWithGoogle: "Continuar con Google", // 03-pantallas §7
  continueWithMicrosoft: "Continuar con Microsoft", // 03-pantallas §7
  // 04-contenido §5 (DP-025): en /login aún no se eligió proveedor, así que nombra los dos.
  privacyNote:
    "Usamos tu nombre, correo y foto de perfil solo para identificarte. No accedemos a nada más de tu cuenta de Google o Microsoft.",
  // 04-contenido §5 (DP-025): forma genérica de {proveedor} cuando no se conoce.
  genericProvider: "tu proveedor de acceso",
  // 04-contenido §5 (DP-025)
  logout: "Cerrar sesión",
  // 04-contenido §5
  sessionExpired: "Tu sesión terminó. Vuelve a iniciar sesión para continuar.",
  retry: "Volver a intentar", // 03-pantallas §7
  errors: {
    // 04-contenido §5
    oauth_denied:
      "Cancelaste el inicio de sesión con {proveedor}. Puedes intentarlo de nuevo cuando quieras.",
    // 04-contenido §5
    oauth_failed: "{proveedor} no respondió. Intenta en unos minutos o usa otro proveedor.",
    // 04-contenido §5 (DP-025)
    email_not_verified:
      "{proveedor} no confirma que tu correo esté verificado. Verifícalo allí e inténtalo de nuevo.",
    // 04-contenido §5 (DP-025)
    email_missing:
      "{proveedor} no compartió tu correo y lo necesitamos para crear tu cuenta. Revisa los permisos e inténtalo de nuevo.",
    // 04-contenido §5 (DP-025): no nombra el proveedor para no revelar datos de la cuenta.
    account_exists_other_provider:
      "Ya existe una cuenta con ese correo, creada con otro proveedor. Entra con el proveedor que usaste al registrarte.",
    // 04-contenido §5 (DP-025): sin canal de contacto en el MVP (DP-024).
    account_disabled: "Tu cuenta está desactivada.",
    // 04-contenido §5
    generic: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",
  },
} as const;

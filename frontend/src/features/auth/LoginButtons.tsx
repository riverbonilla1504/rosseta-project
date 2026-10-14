"use client";

import type { Provider } from "./copy";
import { copy } from "./copy";
import styles from "./LoginButtons.module.css";

/** Conexiones de Auth0 (auth-flow.md §1): Google y la social de Microsoft (solo personales). */
const CONNECTIONS: Record<Provider, string> = {
  google: "google-oauth2",
  microsoft: "windowslive",
};

const PROVIDER_COOKIE = "rosetta_login_provider";
const PROVIDER_COOKIE_MAX_AGE = 600;

/** Guarda el proveedor elegido para completar {proveedor} en la pantalla de error (FR-036). */
function rememberProvider(provider: Provider) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PROVIDER_COOKIE}=${provider}; Max-Age=${PROVIDER_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function loginHref(provider: Provider, returnTo: string) {
  const params = new URLSearchParams({ connection: CONNECTIONS[provider], returnTo });
  return `/auth/login?${params.toString()}`;
}

/** Acciones de acceso (FR-001, FR-002). `returnTo` ya llega validado con safeReturnTo. */
export function LoginButtons({ returnTo }: { returnTo: string }) {
  return (
    <div className={styles.actions}>
      <a
        className={styles.action}
        href={loginHref("google", returnTo)}
        onClick={() => rememberProvider("google")}
      >
        {copy.continueWithGoogle}
      </a>
      <a
        className={styles.action}
        href={loginHref("microsoft", returnTo)}
        onClick={() => rememberProvider("microsoft")}
      >
        {copy.continueWithMicrosoft}
      </a>
    </div>
  );
}

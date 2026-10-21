import { cookies, headers } from "next/headers";

import { AuthError } from "@/features/auth/AuthError";
import { copy } from "@/features/auth/copy";
import { errorMessage, normalizeErrorCode, providerFromCookie } from "@/features/auth/errorCodes";
import { DEFAULT_RETURN_TO, safeReturnTo } from "@/features/auth/safeReturnTo";

import styles from "../../login/page.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Pantalla de error de acceso (FR-036 a FR-039; ROS-184). El código llega en la consulta o,
 * tras /auth/denied, en la cookie efímera rosetta_auth_error, que el middleware consume y
 * pasa en la cabecera interna x-rosetta-auth-error (tiene prioridad). Siempre hay salida.
 */
export default async function AuthErrorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const fromCookie = (await headers()).get("x-rosetta-auth-error");
  const rawCode = fromCookie ?? params.code;
  const code = rawCode === undefined ? null : normalizeErrorCode(rawCode);
  const provider = providerFromCookie((await cookies()).get("rosetta_login_provider")?.value);

  const returnTo = safeReturnTo(params.returnTo);
  const retryHref =
    returnTo === DEFAULT_RETURN_TO ? "/login" : `/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-error-title">
        <h1 id="auth-error-title" className={styles.brand}>
          {copy.brand}
        </h1>
        <AuthError message={errorMessage(code, provider)} retryHref={retryHref} />
      </section>
    </main>
  );
}

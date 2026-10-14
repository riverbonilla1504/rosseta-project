import { copy } from "@/features/auth/copy";
import { LoginButtons } from "@/features/auth/LoginButtons";
import { safeReturnTo } from "@/features/auth/safeReturnTo";

import styles from "./page.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Pantalla de acceso (FR-001, FR-002, FR-040; ROS-184). Solo Google y Microsoft, nota de
 * privacidad y destino de regreso interno (FR-015). Con sesión abierta el middleware lleva a /.
 * Con notice=session_expired muestra el aviso de sesión vencida (FR-026; auth-flow.md §1).
 */
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const sessionExpired = params.notice === "session_expired";

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <h1 id="login-title" className={styles.brand}>
          {copy.brand}
        </h1>
        <p className={styles.value}>{copy.valuePhrase}</p>
        {sessionExpired && (
          <p role="status" className={styles.notice}>
            {copy.sessionExpired}
          </p>
        )}
        <LoginButtons returnTo={returnTo} />
        <p className={styles.privacy}>{copy.privacyNote}</p>
      </section>
    </main>
  );
}

"use client";

/**
 * Pestañas del proyecto (FR-007, DP-017): Panorama · Revisión · Catálogo · Fuentes, en ese
 * orden; Hallazgos y Generador no se muestran en el MVP. La activa lleva aria-current.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { TAB_LABELS } from "./copy";
import styles from "./ProjectBar.module.css";

const TABS = [
  { label: TAB_LABELS.overview, segment: "" },
  { label: TAB_LABELS.review, segment: "/review" },
  { label: TAB_LABELS.catalog, segment: "/catalog" },
  { label: TAB_LABELS.sources, segment: "/sources" },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/p/${projectId}`;

  return (
    <nav className={styles.tabs}>
      {TABS.map(({ label, segment }) => {
        const href = `${base}${segment}`;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={styles.tab}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

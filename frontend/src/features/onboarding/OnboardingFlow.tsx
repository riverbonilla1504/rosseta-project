"use client";

/**
 * Onboarding de un paso (feature 002, ROS-186; FR-019, FR-020): la bienvenida por el nombre y el
 * formulario de creación de proyecto de la feature 003, sin duplicarlo (003, FR-002). Crear el
 * proyecto completa el onboarding y lleva a /projects (FR-018). Sin paso de carga de DDL: llega
 * con la feature 004.
 */
import { useRouter } from "next/navigation";

import { copy } from "@/features/auth/copy";
import { ProjectForm } from "@/features/projects/ProjectForm";

import { completeOnboarding } from "./api";
import styles from "./OnboardingFlow.module.css";

export function OnboardingFlow({ name }: { name: string }) {
  const router = useRouter();

  // Si completar falla, el error llega al formulario (error genérico) y no se navega.
  async function handleCreated() {
    await completeOnboarding();
    router.push("/projects");
  }

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{copy.welcome(name)}</h1>
      <div className={styles.form}>
        <ProjectForm onCreated={handleCreated} />
      </div>
    </section>
  );
}

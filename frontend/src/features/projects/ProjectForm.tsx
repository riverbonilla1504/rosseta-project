"use client";

/**
 * Formulario compartido de creación de proyecto (contracts/ui-project-form.md, feature 003).
 * Implementa FR-001…FR-004 y FR-029 (ROS-174). Lo usan /projects (003) y /onboarding (002,
 * T055): el onboarding solo añade la bienvenida y la llamada a complete en onCreated (FR-002).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api/client";

import { createProject, type Dialect, type ProjectSummary } from "./api";
import { DIALECT_LABELS, DIALECTS, projectsCopy } from "./copy";
import styles from "./ProjectForm.module.css";
import { projectKeys } from "./queryKeys";

const NAME_MAX_LENGTH = 120;

type Field = "name" | "source_dialect";
type Errors = Partial<Record<Field, string>>;

type Props = {
  onCreated: (project: ProjectSummary) => void | Promise<void>;
  submitLabel?: string;
};

function nameError(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return projectsCopy.nameRequired;
  if (trimmed.length > NAME_MAX_LENGTH) return projectsCopy.nameTooLong;
  return undefined;
}

function localErrors(name: string, dialect: Dialect | null): Errors {
  const errors: Errors = {};
  const forName = nameError(name);
  if (forName) errors.name = forName;
  if (!dialect) errors.source_dialect = projectsCopy.dialectRequired;
  return errors;
}

/** Errores del servidor por campo; la interfaz pone sus propios textos (no los de la API). */
function serverErrors(error: ApiError, details: Record<string, unknown>, name: string): Errors {
  if (error.code === "project_name_taken") return { name: projectsCopy.nameTaken };
  const errors: Errors = {};
  if ("name" in details) errors.name = nameError(name) ?? projectsCopy.nameRequired;
  if ("source_dialect" in details) errors.source_dialect = projectsCopy.dialectRequired;
  return errors;
}

export function ProjectForm({ onCreated, submitLabel = projectsCopy.submit }: Props) {
  const id = useId();
  const queryClient = useQueryClient();
  const nameRef = useRef<HTMLInputElement>(null);
  const firstDialectRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [dialect, setDialect] = useState<Dialect | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [generic, setGeneric] = useState(false);

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
      await onCreated(project);
    },
  });

  function focusFirst(found: Errors) {
    if (found.name) nameRef.current?.focus();
    else if (found.source_dialect) firstDialectRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setGeneric(false);

    const found = localErrors(name, dialect);
    setErrors(found);
    if (Object.keys(found).length > 0 || !dialect) {
      focusFirst(found);
      return;
    }

    try {
      await mutation.mutateAsync({ name: name.trim(), source_dialect: dialect });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const fromServer = serverErrors(error, error.details, name);
        setErrors(fromServer);
        focusFirst(fromServer);
      } else if (!(error instanceof ApiError && error.status === 401)) {
        // 401 y cuenta rechazada ya navegan desde apiFetch (002, FR-026).
        setGeneric(true);
      }
    }
  }

  const nameErrorId = `${id}-name-error`;
  const dialectErrorId = `${id}-dialect-error`;
  const dialectLabelId = `${id}-dialect-label`;

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-name`}>
          {projectsCopy.nameLabel}
        </label>
        <input
          ref={nameRef}
          id={`${id}-name`}
          className={styles.input}
          name="name"
          type="text"
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          value={name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          onChange={(event) => setName(event.target.value)}
        />
        {errors.name && (
          <p id={nameErrorId} className={styles.error} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div
        className={styles.field}
        role="radiogroup"
        aria-labelledby={dialectLabelId}
        aria-invalid={errors.source_dialect ? true : undefined}
        aria-describedby={errors.source_dialect ? dialectErrorId : undefined}
      >
        <span id={dialectLabelId} className={styles.label}>
          {projectsCopy.dialectLabel}
        </span>
        <div className={styles.options}>
          {DIALECTS.map((value, index) => (
            <label key={value} className={styles.option}>
              <input
                ref={index === 0 ? firstDialectRef : undefined}
                type="radio"
                name="source_dialect"
                value={value}
                checked={dialect === value}
                onChange={() => setDialect(value)}
              />
              {DIALECT_LABELS[value]}
            </label>
          ))}
        </div>
        {errors.source_dialect && (
          <p id={dialectErrorId} className={styles.error} role="alert">
            {errors.source_dialect}
          </p>
        )}
      </div>

      {generic && (
        <p className={styles.error} role="alert">
          {projectsCopy.genericError}
        </p>
      )}

      <button className={styles.submit} type="submit" disabled={mutation.isPending}>
        {submitLabel}
      </button>
    </form>
  );
}

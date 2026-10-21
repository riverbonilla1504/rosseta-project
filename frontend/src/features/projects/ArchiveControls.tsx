"use client";

/**
 * Renombrar, archivar y desarchivar el proyecto abierto (feature 003, ROS-174; FR-010…FR-013).
 * Activo: "Renombrar" (mismas reglas del nombre que el formulario) y "Archivar" con confirmación;
 * al archivar se vuelve a /projects. Archivado: aviso de solo lectura y "Desarchivar"; si el
 * nombre choca con un activo se pide otro antes. Textos de 04-contenido §5 (DP-028).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { ApiError } from "@/lib/api/client";

import { getProject, updateProject, type ProjectChanges, type ProjectSummary } from "./api";
import styles from "./ArchiveControls.module.css";
import { projectsCopy } from "./copy";
import { projectKeys } from "./queryKeys";
import { NAME_MAX_LENGTH, nameError } from "./validation";

/** Mutación de PATCH que deja la caché del proyecto y de las listas al día (research R-13). */
function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: ProjectChanges) => updateProject(projectId, changes),
    onSuccess: async (project) => {
      queryClient.setQueryData(projectKeys.detail(projectId), project);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.state(projectId) }),
      ]);
    },
  });
}

/** Texto del error de nombre que devuelve la API, con los textos de la interfaz. */
function serverNameError(error: unknown, name: string): string {
  if (error instanceof ApiError && error.code === "project_name_taken") {
    return projectsCopy.nameTaken;
  }
  if (error instanceof ApiError && error.status === 400) {
    return nameError(name) ?? projectsCopy.nameRequired;
  }
  return projectsCopy.genericError;
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
    return () => opener?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") onClose();
  }

  return (
    <div className={styles.overlay}>
      <div
        ref={ref}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function NameField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {projectsCopy.nameLabel}
      </label>
      <input
        id={id}
        className={styles.input}
        type="text"
        autoComplete="off"
        maxLength={NAME_MAX_LENGTH}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function RenameDialog({ project, onClose }: { project: ProjectSummary; onClose: () => void }) {
  const mutation = useUpdateProject(project.id);
  const [name, setName] = useState(project.name);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const local = nameError(name);
    setError(local);
    if (local) return;
    try {
      await mutation.mutateAsync({ name: name.trim() });
      onClose();
    } catch (failure) {
      if (!(failure instanceof ApiError && failure.status === 401)) {
        setError(serverNameError(failure, name));
      }
    }
  }

  return (
    <Dialog title={projectsCopy.renameTitle} onClose={onClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <NameField value={name} error={error} onChange={setName} />
        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={mutation.isPending}>
            {projectsCopy.save}
          </button>
          <button className={styles.button} type="button" onClick={onClose}>
            {projectsCopy.cancel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function ArchiveDialog({ project, onClose }: { project: ProjectSummary; onClose: () => void }) {
  const router = useRouter();
  const mutation = useUpdateProject(project.id);
  const [failed, setFailed] = useState(false);

  async function handleArchive() {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync({ archived: true });
      router.push("/projects");
    } catch (failure) {
      if (!(failure instanceof ApiError && failure.status === 401)) setFailed(true);
    }
  }

  return (
    <Dialog title={projectsCopy.archiveTitle(project.name)} onClose={onClose}>
      <p className={styles.text}>{projectsCopy.archiveBody}</p>
      {failed && (
        <p className={styles.error} role="alert">
          {projectsCopy.genericError}
        </p>
      )}
      <div className={styles.actions}>
        <button
          className={styles.button}
          type="button"
          disabled={mutation.isPending}
          onClick={handleArchive}
        >
          {projectsCopy.archive}
        </button>
        <button className={styles.button} type="button" onClick={onClose}>
          {projectsCopy.cancel}
        </button>
      </div>
    </Dialog>
  );
}

function ActiveControls({ project }: { project: ProjectSummary }) {
  const [open, setOpen] = useState<"rename" | "archive" | null>(null);
  const close = () => setOpen(null);

  return (
    <div className={styles.controls}>
      <button className={styles.button} type="button" onClick={() => setOpen("rename")}>
        {projectsCopy.rename}
      </button>
      <button className={styles.button} type="button" onClick={() => setOpen("archive")}>
        {projectsCopy.archive}
      </button>
      {open === "rename" && <RenameDialog project={project} onClose={close} />}
      {open === "archive" && <ArchiveDialog project={project} onClose={close} />}
    </div>
  );
}

function ArchivedNotice({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const mutation = useUpdateProject(project.id);
  const [needsName, setNeedsName] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const changes: ProjectChanges = { archived: false };
    if (needsName) {
      const local = nameError(name);
      setError(local);
      if (local) return;
      changes.name = name.trim();
    }
    try {
      await mutation.mutateAsync(changes);
      // El layout del proyecto (servidor) vuelve a pintarse sin el modo de solo lectura.
      router.refresh();
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === "project_name_taken" && !needsName) {
        setNeedsName(true);
      } else if (!(failure instanceof ApiError && failure.status === 401)) {
        setError(serverNameError(failure, name));
      }
    }
  }

  return (
    <form className={styles.notice} noValidate onSubmit={handleSubmit}>
      <p className={styles.text}>{projectsCopy.archivedNotice}</p>
      {needsName && (
        <>
          <p className={styles.text} role="alert">
            {projectsCopy.unarchiveNameTaken(project.name)}
          </p>
          <NameField value={name} error={error} onChange={setName} />
        </>
      )}
      {!needsName && error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={mutation.isPending}>
          {projectsCopy.unarchive}
        </button>
      </div>
    </form>
  );
}

export function ArchiveControls({ projectId }: { projectId: string }) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: ({ signal }) => getProject(projectId, signal),
  });

  if (!project.data) return null;
  return project.data.archived ? (
    <ArchivedNotice project={project.data} />
  ) : (
    <ActiveControls project={project.data} />
  );
}

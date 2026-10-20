/**
 * Textos de proyectos (research R-16 de la feature 003), tal cual
 * docs/05-diseno/04-contenido-y-redaccion.md §5 (DP-028 decidida por CD-015).
 */
import type { Dialect } from "./api";

/** Etiquetas del selector (DP-019, 04-contenido §5). La insignia usa el valor interno. */
export const DIALECT_LABELS: Record<Dialect, string> = {
  tsql: "SQL Server",
  oracle: "Oracle",
  postgres: "PostgreSQL",
};

/** Pestañas del proyecto, en su orden (DP-017; 03-pantallas, estructura común). */
export const TAB_LABELS = {
  overview: "Panorama",
  review: "Revisión",
  catalog: "Catálogo",
  sources: "Fuentes",
  showArchived: "Ver archivados",
  showActive: "Ver activos",
  rename: "Renombrar",
  renameTitle: "Renombrar proyecto",
  save: "Guardar",
  cancel: "Cancelar",
  archive: "Archivar",
  archiveTitle: (name: string) => `Archivar ${name}`,
  archiveBody:
    "El proyecto deja de aparecer en tu lista. Sus datos se conservan y puedes desarchivarlo cuando quieras.",
  archivedNotice: "Proyecto archivado: solo lectura. Desarchívalo para hacer cambios.",
  unarchive: "Desarchivar",
  unarchiveNameTaken: (name: string) =>
    `Ya tienes un proyecto activo llamado ${name}. Elige otro nombre para desarchivarlo.`,
  // Temporal, hasta la feature de cada pestaña (proyecto con fuentes).
  tabUnavailable: (tab: string) => `${tab} aún no está disponible.`,
} as const;

/** Orden del selector: el de DP-019. */
export const DIALECTS: readonly Dialect[] = ["tsql", "oracle", "postgres"];

export const projectsCopy = {
  // 04-contenido §5 (ROS-174, EC-022).
  empty: "Aún no tienes proyectos.",
  // 04-contenido §5.
  noEvidence: "Todavía no hay evidencia. Sube el DDL de tu base para empezar.",
  // 04-contenido §5.
  genericError: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.",

  // 04-contenido §5 (DP-028).
  title: "Proyectos",
  nameLabel: "Nombre del proyecto",
  dialectLabel: "Dialecto SQL",
  submit: "Crear proyecto",
  nameRequired: "Escribe un nombre para el proyecto.",
  nameTooLong: "El nombre puede tener hasta 120 caracteres.",
  dialectRequired: "Elige el dialecto SQL de tu base.",
  nameTaken: "Ya tienes un proyecto activo con ese nombre. Elige otro.",
  columnName: "Nombre",
  columnDialect: "Dialecto",
  columnActivity: "Última actividad",
  columnTables: "Tablas",
  columnColumns: "Columnas",
  columnConfirmed: "Confirmadas",
  // Porcentaje confirmado sin columnas (DP-020).
  noRatio: "–",
  // Nombre accesible del selector de proyecto.
  switchProject: "Cambiar de proyecto",
  notFound: "Este proyecto no existe o no tienes acceso.",
  goToProjects: "Ir a tus proyectos",
  showArchived: "Ver archivados",
  showActive: "Ver activos",
  rename: "Renombrar",
  renameTitle: "Renombrar proyecto",
  save: "Guardar",
  cancel: "Cancelar",
  archive: "Archivar",
  archiveTitle: (name: string) => `Archivar ${name}`,
  archiveBody:
    "El proyecto deja de aparecer en tu lista. Sus datos se conservan y puedes desarchivarlo cuando quieras.",
  archivedNotice: "Proyecto archivado: solo lectura. Desarchívalo para hacer cambios.",
  unarchive: "Desarchivar",
  unarchiveNameTaken: (name: string) =>
    `Ya tienes un proyecto activo llamado ${name}. Elige otro nombre para desarchivarlo.`,
  // Temporal, hasta la feature de cada pestaña (proyecto con fuentes).
  tabUnavailable: (tab: string) => `${tab} aún no está disponible.`,
} as const;

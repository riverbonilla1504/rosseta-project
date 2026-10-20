/**
 * Textos de proyectos (research R-16 de la feature 003). Los que define
 * docs/05-diseno/04-contenido-y-redaccion.md §5 van tal cual; el resto son las propuestas de
 * DP-028 y siguen PROVISIONALES hasta que se cierre por CD.
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

  // PROVISIONAL (DP-028)
  title: "Proyectos",
  // PROVISIONAL (DP-028)
  nameLabel: "Nombre del proyecto",
  // PROVISIONAL (DP-028)
  dialectLabel: "Dialecto SQL",
  // PROVISIONAL (DP-028)
  submit: "Crear proyecto",
  // PROVISIONAL (DP-028)
  nameRequired: "Escribe un nombre para el proyecto.",
  // PROVISIONAL (DP-028)
  nameTooLong: "El nombre puede tener hasta 120 caracteres.",
  // PROVISIONAL (DP-028)
  dialectRequired: "Elige el dialecto SQL de tu base.",
  // PROVISIONAL (DP-028)
  nameTaken: "Ya tienes un proyecto activo con ese nombre. Elige otro.",
  // PROVISIONAL (DP-028)
  columnName: "Nombre",
  // PROVISIONAL (DP-028)
  columnDialect: "Dialecto",
  // PROVISIONAL (DP-028)
  columnActivity: "Última actividad",
  // PROVISIONAL (DP-028)
  columnTables: "Tablas",
  // PROVISIONAL (DP-028)
  columnColumns: "Columnas",
  // PROVISIONAL (DP-028)
  columnConfirmed: "Confirmadas",
  // PROVISIONAL (DP-028): porcentaje confirmado sin columnas (DP-020).
  noRatio: "–",
  // PROVISIONAL (DP-028): nombre accesible del selector de proyecto.
  switchProject: "Cambiar de proyecto",
  // PROVISIONAL (DP-028)
  notFound: "Este proyecto no existe o no tienes acceso.",
  // PROVISIONAL (DP-028)
  goToProjects: "Ir a tus proyectos",
} as const;

import { TAB_LABELS } from "@/features/projects/copy";
import { ProjectTabPlaceholder } from "@/features/projects/ProjectTabPlaceholder";

/** Catálogo del proyecto (FR-007). Vacía hasta su feature (research R-14 de la feature 003). */
export default function CatalogPage() {
  return <ProjectTabPlaceholder title={TAB_LABELS.catalog} />;
}

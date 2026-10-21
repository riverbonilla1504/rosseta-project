import { TAB_LABELS } from "@/features/projects/copy";
import { ProjectTabPlaceholder } from "@/features/projects/ProjectTabPlaceholder";

/** Revisión del proyecto (FR-007). Vacía hasta su feature (research R-14 de la feature 003). */
export default function ReviewPage() {
  return <ProjectTabPlaceholder title={TAB_LABELS.review} />;
}

/**
 * Reglas del nombre de proyecto en la interfaz (FR-001, FR-003): las mismas al crear, renombrar
 * y desarchivar con un nombre nuevo (FR-011, FR-013). La API las vuelve a comprobar.
 */
import { projectsCopy } from "./copy";

export const NAME_MAX_LENGTH = 120;

export function nameError(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return projectsCopy.nameRequired;
  if (trimmed.length > NAME_MAX_LENGTH) return projectsCopy.nameTooLong;
  return undefined;
}

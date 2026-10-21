/**
 * Rosetta · Action post-login (ADR-0007, ROS-183; CD-008).
 * Contrato: specs/002-autenticacion-oauth/contracts/auth-flow.md §7.
 * - Deniega si no hay correo (email_missing) o si el correo no está verificado
 *   (email_not_verified): solo se acepta email_verified === true (FR-004).
 * - Añade al access token de "Rosetta API" los claims con espacio de nombres
 *   https://rosetta/: email, name, picture y email_verified (el backend lo exige).
 * - No llama a Rosetta. Vive solo en el tenant (DP-026).
 */
exports.onExecutePostLogin = async (event, api) => {
  if (!event.user.email) {
    api.access.deny("email_missing");
    return;
  }
  if (event.user.email_verified !== true) {
    api.access.deny("email_not_verified");
    return;
  }

  const audience = "https://api.rosetta.local";
  if (event.resource_server && event.resource_server.identifier === audience) {
    const ns = "https://rosetta/";
    api.accessToken.setCustomClaim(`${ns}email`, event.user.email);
    api.accessToken.setCustomClaim(`${ns}name`, event.user.name || null);
    api.accessToken.setCustomClaim(`${ns}picture`, event.user.picture || null);
    api.accessToken.setCustomClaim(`${ns}email_verified`, true);
  }
};

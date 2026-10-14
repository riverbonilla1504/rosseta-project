// Proveedor de identidad simulado para E2E (research R-13). Lo arranca playwright.config.ts.
// Solo datos sintéticos (RNF-38). T032 añade el control de claims, cancelación y denegación
// en mock-idp.ts; este archivo solo levanta el servidor con una clave RS256.
import { OAuth2Server } from "oauth2-mock-server";

const port = Number(process.env.MOCK_IDP_PORT ?? 4010);
const server = new OAuth2Server();
await server.issuer.keys.generate("RS256");
await server.start(port, "localhost");
process.stdout.write(`mock-idp listo en ${server.issuer.url}\n`);

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

// Proveedor de identidad simulado para E2E (research R-13). Lo arranca playwright.config.ts.
// Solo datos sintéticos (RNF-38). Se controla desde las pruebas con tests/e2e/support/mock-idp.ts
// mediante rutas /__control/*: identidad del próximo acceso, vida del access token,
// cancelación o denegación del próximo /authorize y la lista blanca de cierre de sesión.
import { OAuth2Server } from "oauth2-mock-server";

const port = Number(process.env.MOCK_IDP_PORT ?? 4010);
const audience = process.env.MOCK_IDP_AUDIENCE ?? "https://api.rosetta.local";
const appBaseUrl = process.env.MOCK_IDP_APP_BASE_URL ?? "http://localhost:3100";
const NS = "https://rosetta/";
// Lista blanca de cierre de sesión, igual que el tenant (CD-007): exactamente estas dos.
const allowedLogoutUrls = [`${appBaseUrl}/login`, `${appBaseUrl}/auth/error`];

const defaults = () => ({
  identity: {
    sub: "google-oauth2|e2e-default",
    email: "persona@example.test",
    name: "Persona de Prueba",
    picture: null,
    email_verified: true,
  },
  tokenTtl: 900,
  nextAuthorize: null, // null | { error, description }
  rejectRefresh: false, // true: el canje del refresh token responde invalid_grant
  logouts: [],
  authorizeRequests: [],
});
let state = defaults();

// El SDK deriva el emisor con barra final (https://tenant/), como Auth0.
const server = new OAuth2Server(undefined, undefined, {
  shouldIssuerUrlBeSuffixedWithATralingSlash: true,
});
await server.issuer.keys.generate("RS256");

server.issuer.on("beforeSigning", (token) => {
  const { payload } = token;
  const now = Math.floor(Date.now() / 1000);
  payload.sub = state.identity.sub;
  if (typeof payload.scope === "string") {
    // Access token para Rosetta API con los claims de la Acción post-login (auth-flow.md §6-§7).
    payload.aud = [audience];
    payload.iat = now;
    payload.exp = now + state.tokenTtl;
    if (state.identity.email) payload[`${NS}email`] = state.identity.email;
    if (state.identity.name) payload[`${NS}name`] = state.identity.name;
    if (state.identity.picture) payload[`${NS}picture`] = state.identity.picture;
    if (state.identity.email_verified !== undefined) {
      payload[`${NS}email_verified`] = state.identity.email_verified;
    }
  } else {
    payload.email = state.identity.email;
    payload.name = state.identity.name;
  }
});

server.service.on("beforeResponse", (response, req) => {
  if (state.rejectRefresh && req.body?.grant_type === "refresh_token") {
    // Como Auth0 ante un refresh token revocado o reutilizado.
    response.statusCode = 400;
    response.body = {
      error: "invalid_grant",
      error_description: "Unknown or invalid refresh token.",
    };
    return;
  }
  if (response.body && typeof response.body === "object" && "expires_in" in response.body) {
    response.body.expires_in = state.tokenTtl;
  }
});

server.service.on("beforeAuthorizeRedirect", (redirect, req) => {
  state.authorizeRequests.push(Object.fromEntries(new URL(req.url, "http://x").searchParams));
  const next = state.nextAuthorize;
  if (!next) return;
  state.nextAuthorize = null;
  // Como Auth0: cancelación y denegación de la Acción llegan como error=access_denied.
  redirect.url.searchParams.delete("code");
  redirect.url.searchParams.set("error", next.error);
  redirect.url.searchParams.set("error_description", next.description);
});

server.service.on("beforePostLogoutRedirect", (redirect) => {
  const target = `${redirect.url.origin}${redirect.url.pathname}`;
  const accepted = allowedLogoutUrls.includes(target);
  state.logouts.push({ target, accepted });
  if (!accepted) {
    redirect.url = new URL(`${server.issuer.url}__control/logout-rejected`);
  }
});

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

server.service.addRoute("POST", "/__control/reset", (_req, res) => {
  state = defaults();
  json(res, 200, { ok: true });
});
server.service.addRoute("POST", "/__control/identity", (req, res) => {
  state.identity = { ...defaults().identity, ...req.body };
  json(res, 200, state.identity);
});
server.service.addRoute("POST", "/__control/token-ttl", (req, res) => {
  state.tokenTtl = Number(req.body.seconds);
  json(res, 200, { tokenTtl: state.tokenTtl });
});
server.service.addRoute("POST", "/__control/next-authorize", (req, res) => {
  state.nextAuthorize = { error: req.body.error, description: req.body.description ?? "" };
  json(res, 200, state.nextAuthorize);
});
server.service.addRoute("POST", "/__control/reject-refresh", (req, res) => {
  state.rejectRefresh = Boolean(req.body.reject);
  json(res, 200, { rejectRefresh: state.rejectRefresh });
});
server.service.addRoute("GET", "/__control/state", (_req, res) => {
  json(res, 200, { logouts: state.logouts, authorizeRequests: state.authorizeRequests });
});
server.service.addRoute("GET", "/__control/logout-rejected", (_req, res) => {
  json(res, 400, { error: "invalid_logout_url" });
});

await server.start(port, "localhost");
process.stdout.write(`mock-idp listo en ${server.issuer.url}\n`);

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

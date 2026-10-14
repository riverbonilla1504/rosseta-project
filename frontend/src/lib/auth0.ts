import { Auth0Client } from "@auth0/nextjs-auth0/server";

import { buildAuth0Options } from "./auth0-config";

/** Cliente único del SDK (ADR-0007). El hook onCallback llega en T081. */
export const auth0 = new Auth0Client(buildAuth0Options());

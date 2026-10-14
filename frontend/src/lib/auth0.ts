import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

import { buildAuth0Options } from "./auth0-config";
import { callbackRedirect } from "./auth0-callback";

const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

/** Cliente único del SDK (ADR-0007). onCallback lleva los errores a /auth/error (T081). */
export const auth0 = new Auth0Client({
  ...buildAuth0Options(),
  async onCallback(error, ctx) {
    return NextResponse.redirect(callbackRedirect(error, ctx, appBaseUrl));
  },
});

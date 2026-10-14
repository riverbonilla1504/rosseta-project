// @vitest-environment node
import { AuthorizationError, InvalidStateError, OAuth2Error } from "@auth0/nextjs-auth0/errors";
import { describe, expect, it } from "vitest";

import { callbackRedirect } from "@/lib/auth0-callback";

const APP = "http://localhost:3000";

function denied(description: string) {
  return new AuthorizationError({
    cause: new OAuth2Error({ code: "access_denied", message: description }),
  });
}

function target(error: Error | null, returnTo?: string) {
  return new URL(callbackRedirect(error, { returnTo }, APP));
}

describe("onCallback: errores del proveedor → /auth/error (research R-07, R-B)", () => {
  it("[ROS-90][002:FR-036] cancelación del consentimiento → oauth_denied", () => {
    const url = target(denied("User did not authorize the request"));

    expect(url.pathname).toBe("/auth/error");
    expect(url.searchParams.get("code")).toBe("oauth_denied");
  });

  it.each(["email_not_verified", "email_missing"])(
    "[ROS-93][002:FR-004] denegación de la Acción por %s → ese código",
    (reason) => {
      expect(target(denied(reason)).searchParams.get("code")).toBe(reason);
    },
  );

  it.each([
    [
      "server_error",
      new AuthorizationError({ cause: new OAuth2Error({ code: "server_error", message: "x" }) }),
    ],
    ["state", new InvalidStateError()],
    ["red", new Error("fetch failed")],
  ])("[ROS-90][002:FR-037] cualquier otro error (%s) → oauth_failed", (_name, error) => {
    expect(target(error).searchParams.get("code")).toBe("oauth_failed");
  });

  it("[ROS-90][002:FR-039] un returnTo interno se conserva hacia /auth/error", () => {
    expect(target(denied("x"), "/projects").searchParams.get("returnTo")).toBe("/projects");
  });

  it("[ROS-93][002:FR-015] un returnTo externo no se conserva", () => {
    expect(target(denied("x"), "https://evil.example").searchParams.has("returnTo")).toBe(false);
  });

  it("[ROS-93][002:FR-015] el éxito redirige a un returnTo seguro", () => {
    expect(target(null, "/projects").toString()).toBe(`${APP}/projects`);
    expect(target(null, "https://evil.example").toString()).toBe(`${APP}/`);
  });
});

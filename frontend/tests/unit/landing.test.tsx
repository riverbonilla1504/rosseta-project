import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect }));

const getCurrentUser = vi.fn();
vi.mock("@/features/auth/currentUser", () => ({ getCurrentUser }));

const { default: Landing } = await import("@/app/page");

async function landingRedirect() {
  await expect(Landing()).rejects.toThrow(/NEXT_REDIRECT/);
  return redirect.mock.calls.at(-1)?.[0];
}

const user = (onboarding_completed: boolean) => ({
  status: "ok" as const,
  user: {
    id: "u1",
    email: "a@example.test",
    full_name: "A",
    avatar_url: null,
    onboarding_completed,
  },
});

describe("resolución del destino en /", () => {
  beforeEach(() => {
    redirect.mockClear();
    getCurrentUser.mockReset();
  });

  it("[ROS-91][002:FR-018] onboarding pendiente → /onboarding", async () => {
    getCurrentUser.mockResolvedValue(user(false));

    expect(await landingRedirect()).toBe("/onboarding");
  });

  it("[ROS-89][002:FR-014] onboarding completado → /projects", async () => {
    getCurrentUser.mockResolvedValue(user(true));

    expect(await landingRedirect()).toBe("/projects");
  });

  it.each(["account_disabled", "account_exists_other_provider", "email_not_verified"])(
    "[ROS-90][002:FR-009] 403 %s del backend → /auth/denied?code=…",
    async (code) => {
      getCurrentUser.mockResolvedValue({ status: "denied", code });

      expect(await landingRedirect()).toBe(`/auth/denied?code=${code}`);
    },
  );

  it("[ROS-89][002:FR-014] sin sesión (401) → /login?returnTo=/", async () => {
    getCurrentUser.mockResolvedValue({ status: "unauthenticated" });

    expect(await landingRedirect()).toBe("/login?returnTo=%2F");
  });
});

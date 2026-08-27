import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { isAdminUser, requireAdmin } from "@/lib/admin";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("isAdminUser", () => {
  it("matches usernames listed in ADMIN_USERNAMES", () => {
    vi.stubEnv("ADMIN_USERNAMES", "kane, alice");
    expect(isAdminUser("kane")).toBe(true);
    expect(isAdminUser("alice")).toBe(true);
    expect(isAdminUser("bob")).toBe(false);
  });

  it("is case-insensitive and tolerates spaces", () => {
    vi.stubEnv("ADMIN_USERNAMES", " Kane , ALICE ");
    expect(isAdminUser("kane")).toBe(true);
    expect(isAdminUser("Alice")).toBe(true);
  });

  it("rejects empty or missing usernames", () => {
    vi.stubEnv("ADMIN_USERNAMES", "kane");
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser("")).toBe(false);
  });

  it("rejects everyone when the env var is unset", () => {
    expect(isAdminUser("kane")).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const guard = await requireAdmin();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
  });

  it("returns 403 for a non-admin session", async () => {
    vi.stubEnv("ADMIN_USERNAMES", "kane");
    mocks.getSession.mockResolvedValue({ user: { id: "u-1", username: "bob" } });
    const guard = await requireAdmin();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(403);
  });

  it("returns 403 when the session user has no username", async () => {
    vi.stubEnv("ADMIN_USERNAMES", "kane");
    mocks.getSession.mockResolvedValue({ user: { id: "u-1", username: null } });
    const guard = await requireAdmin();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(403);
  });

  it("passes the session through for an admin", async () => {
    vi.stubEnv("ADMIN_USERNAMES", "kane");
    mocks.getSession.mockResolvedValue({ user: { id: "u-1", username: "kane" } });
    const guard = await requireAdmin();
    expect(guard.ok).toBe(true);
    if (guard.ok) expect(guard.session.user.username).toBe("kane");
  });
});

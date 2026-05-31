import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useMutation: (opts: Record<string, unknown>) => ({
    mutationFn: opts.mutationFn,
    onSuccess: opts.onSuccess,
  }),
  useQuery: (opts: Record<string, unknown>) => ({
    ...opts,
    queryFn: opts.queryFn,
    data: undefined,
    isLoading: true,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

describe("useRooms", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch rooms", async () => {
    const mockRooms = [
      {
        id: "1",
        name: "Room",
        description: null,
        hasPassword: false,
        participantCount: 0,
        config: null,
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRooms),
      }),
    );

    const { useRooms } = await import("@/queries/use-rooms");
    const result = useRooms();
    // @ts-expect-error - mock returns queryFn not in UseQueryResult
    const rooms = await result.queryFn();
    expect(rooms).toHaveLength(1);
    expect(rooms[0].name).toBe("Room");
  });

  it("should throw on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const { useRooms } = await import("@/queries/use-rooms");
    const result = useRooms();
    // @ts-expect-error - mock returns queryFn not in UseQueryResult
    await expect(result.queryFn()).rejects.toThrow("Failed to fetch rooms");
  });
});

describe("useCreateRoom", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should validate and create room", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new" }),
      }),
    );

    const { useCreateRoom } = await import("@/queries/use-rooms");
    const result = useCreateRoom();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    const res = await result.mutationFn({ name: "New Room" });
    expect(res.id).toBe("new");
  });

  it("should reject invalid input", async () => {
    const { useCreateRoom } = await import("@/queries/use-rooms");
    const result = useCreateRoom();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await expect(result.mutationFn({ name: "" })).rejects.toThrow();
  });

  it("should throw on server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      }),
    );

    const { useCreateRoom } = await import("@/queries/use-rooms");
    const result = useCreateRoom();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await expect(result.mutationFn({ name: "Valid Name" })).rejects.toThrow("Server error");
  });
});

describe("useLiveKitToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: "lk-token-123" }),
      }),
    );

    const { useLiveKitToken } = await import("@/queries/use-livekit");
    const result = useLiveKitToken();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    const token = await result.mutationFn("room-1");
    expect(token).toBe("lk-token-123");
  });

  it("should return empty string when no token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const { useLiveKitToken } = await import("@/queries/use-livekit");
    const result = useLiveKitToken();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    const token = await result.mutationFn("room-1");
    expect(token).toBe("");
  });
});

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should update profile", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "user-1", name: "New Name" }),
      }),
    );

    const { useUpdateProfile } = await import("@/queries/use-user");
    const result = useUpdateProfile();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    const res = await result.mutationFn({ name: "New Name" });
    expect(res.name).toBe("New Name");
  });

  it("should throw on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Forbidden" }),
      }),
    );

    const { useUpdateProfile } = await import("@/queries/use-user");
    const result = useUpdateProfile();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await expect(result.mutationFn({ name: "Name" })).rejects.toThrow("Forbidden");
  });
});

describe("useChangePassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should change password", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );

    const { useChangePassword } = await import("@/queries/use-user");
    const result = useChangePassword();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    const res = await result.mutationFn({
      currentPassword: "old",
      newPassword: "new12345",
    });
    expect(res.success).toBe(true);
  });

  it("should throw on wrong password", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "WRONG_PASSWORD" }),
      }),
    );

    const { useChangePassword } = await import("@/queries/use-user");
    const result = useChangePassword();
    await expect(
      // @ts-expect-error - mock returns mutationFn not in UseMutationResult
      result.mutationFn({ currentPassword: "wrong", newPassword: "new12345" }),
    ).rejects.toThrow("WRONG_PASSWORD");
  });
});

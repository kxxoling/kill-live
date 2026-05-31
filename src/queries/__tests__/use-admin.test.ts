import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQueryClient = {
  invalidateQueries: vi.fn(),
};

vi.mock("@tanstack/react-query", () => ({
  useQuery: (opts: Record<string, unknown>) => ({
    ...opts,
    data: undefined,
    isLoading: true,
  }),
  useMutation: (opts: Record<string, unknown>) => ({
    mutate: vi.fn(),
    mutationFn: opts.mutationFn,
    onSuccess: opts.onSuccess,
    isPending: false,
    isError: false,
    data: undefined,
  }),
  useQueryClient: () => mockQueryClient,
}));

describe("useAdminRooms", () => {
  it("should define correct query key", async () => {
    const { useAdminRooms } = await import("@/queries/use-admin");
    const result = useAdminRooms();
    // @ts-expect-error - mock returns queryKey not in UseQueryResult
    expect(result.queryKey).toEqual(["admin-rooms"]);
  });
});

describe("useAdminUsers", () => {
  it("should define correct query key", async () => {
    const { useAdminUsers } = await import("@/queries/use-admin");
    const result = useAdminUsers();
    // @ts-expect-error - mock returns queryKey not in UseQueryResult
    expect(result.queryKey).toEqual(["admin-users"]);
  });
});

describe("useAdminDeleteRoom mutation", () => {
  beforeEach(() => {
    mockQueryClient.invalidateQueries.mockClear();
  });

  it("should call delete endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { useAdminDeleteRoom } = await import("@/queries/use-admin");
    const mutation = useAdminDeleteRoom();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await mutation.mutationFn("room-1");
    expect(fetch).toHaveBeenCalledWith("/api/admin/rooms?id=room-1", {
      method: "DELETE",
    });
  });

  it("should throw on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Not found" }),
      }),
    );
    const { useAdminDeleteRoom } = await import("@/queries/use-admin");
    const mutation = useAdminDeleteRoom();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await expect(mutation.mutationFn("room-1")).rejects.toThrow("Not found");
  });

  it("should invalidate admin-rooms on success", async () => {
    const { useAdminDeleteRoom } = await import("@/queries/use-admin");
    const mutation = useAdminDeleteRoom();
    // @ts-expect-error - mock returns onSuccess not in UseMutationResult
    mutation.onSuccess();
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-rooms"],
    });
  });
});

describe("useAdminDeleteUser mutation", () => {
  beforeEach(() => {
    mockQueryClient.invalidateQueries.mockClear();
  });

  it("should call delete endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { useAdminDeleteUser } = await import("@/queries/use-admin");
    const mutation = useAdminDeleteUser();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await mutation.mutationFn("user-1");
    expect(fetch).toHaveBeenCalledWith("/api/admin/users?id=user-1", {
      method: "DELETE",
    });
  });

  it("should invalidate admin-users on success", async () => {
    const { useAdminDeleteUser } = await import("@/queries/use-admin");
    const mutation = useAdminDeleteUser();
    // @ts-expect-error - mock returns onSuccess not in UseMutationResult
    mutation.onSuccess();
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-users"],
    });
  });
});

describe("useAdminSetRoomPassword mutation", () => {
  beforeEach(() => {
    mockQueryClient.invalidateQueries.mockClear();
  });

  it("should call patch endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { useAdminSetRoomPassword } = await import("@/queries/use-admin");
    const mutation = useAdminSetRoomPassword();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await mutation.mutationFn({ id: "room-1", password: "newpass" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/rooms",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("should handle null password", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { useAdminSetRoomPassword } = await import("@/queries/use-admin");
    const mutation = useAdminSetRoomPassword();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await mutation.mutationFn({ id: "room-1", password: null });
    const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(callBody.password).toBeNull();
  });

  it("should invalidate admin-rooms on success", async () => {
    const { useAdminSetRoomPassword } = await import("@/queries/use-admin");
    const mutation = useAdminSetRoomPassword();
    // @ts-expect-error - mock returns onSuccess not in UseMutationResult
    mutation.onSuccess();
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-rooms"],
    });
  });
});

describe("useAdminCleanup mutation", () => {
  it("should call cleanup endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ updated: 5 }),
      }),
    );
    const { useAdminCleanup } = await import("@/queries/use-admin");
    const mutation = useAdminCleanup();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    const result = await mutation.mutationFn();
    expect(fetch).toHaveBeenCalledWith("/api/admin/cleanup", {
      method: "POST",
    });
    expect(result).toEqual({ updated: 5 });
  });

  it("should throw on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const { useAdminCleanup } = await import("@/queries/use-admin");
    const mutation = useAdminCleanup();
    // @ts-expect-error - mock returns mutationFn not in UseMutationResult
    await expect(mutation.mutationFn()).rejects.toThrow("Failed to cleanup");
  });
});

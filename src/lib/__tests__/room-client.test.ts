import { beforeEach, describe, expect, it, vi } from "vitest";
import { joinRoomClient, leaveRoomClient, mapJoinResponse, postRoomJoin } from "../room-client";

describe("mapJoinResponse", () => {
  it("should return joined on success", () => {
    const result = mapJoinResponse({}, true);
    expect(result).toEqual({ status: "joined", error: "" });
  });

  it("should return password for PASSWORD_REQUIRED", () => {
    const result = mapJoinResponse({ code: "PASSWORD_REQUIRED" }, false);
    expect(result.status).toBe("password");
  });

  it("should return password for WRONG_PASSWORD", () => {
    const result = mapJoinResponse({ code: "WRONG_PASSWORD", error: "Bad pw" }, false);
    expect(result.status).toBe("password");
    expect(result.error).toBe("Bad pw");
  });

  it("should return full for ROOM_FULL", () => {
    const result = mapJoinResponse({ code: "ROOM_FULL" }, false);
    expect(result.status).toBe("full");
  });

  it("should return error for unknown code", () => {
    const result = mapJoinResponse({ code: "UNKNOWN", error: "Something" }, false);
    expect(result.status).toBe("error");
    expect(result.error).toBe("Something");
  });

  it("should use default error message", () => {
    const result = mapJoinResponse({}, false);
    expect(result.error).toBe("Failed to join room");
  });
});

describe("postRoomJoin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should post to join endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = await postRoomJoin("room-1", "pass123");
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/rooms/join",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});

describe("joinRoomClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should use stored password from sessionStorage", async () => {
    sessionStorage.setItem("kill-live:room-pw:room-1", "stored-pw");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = await joinRoomClient("room-1");
    expect(result.ok).toBe(true);

    const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(callBody.password).toBe("stored-pw");
  });

  it("should prefer explicit password over stored", async () => {
    sessionStorage.setItem("kill-live:room-pw:room-1", "stored-pw");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = await joinRoomClient("room-1", "explicit-pw");
    expect(result.ok).toBe(true);

    const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(callBody.password).toBe("explicit-pw");
  });

  it("should clear stored password on success", async () => {
    sessionStorage.setItem("kill-live:room-pw:room-1", "pw");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    await joinRoomClient("room-1");
    expect(sessionStorage.getItem("kill-live:room-pw:room-1")).toBeNull();
  });

  it("should keep stored password on failure", async () => {
    sessionStorage.setItem("kill-live:room-pw:room-1", "pw");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ code: "WRONG_PASSWORD" }),
      }),
    );

    await joinRoomClient("room-1");
    expect(sessionStorage.getItem("kill-live:room-pw:room-1")).toBe("pw");
  });
});

describe("leaveRoomClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should post to leave endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    await leaveRoomClient("room-1");
    expect(fetch).toHaveBeenCalledWith(
      "/api/rooms/leave",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      }),
    );
  });
});

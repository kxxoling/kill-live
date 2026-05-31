import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePasswordRoom } from "@/app/use-password-room";

describe("usePasswordRoom", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should start with null room", () => {
    const { result } = renderHook(() => usePasswordRoom());
    expect(result.current.passwordRoom).toBeNull();
    expect(result.current.passwordError).toBe("");
    expect(result.current.passwordLoading).toBe(false);
  });

  it("should open password dialog", () => {
    const { result } = renderHook(() => usePasswordRoom());
    act(() => {
      result.current.openPasswordDialog("room-1", "Test Room");
    });
    expect(result.current.passwordRoom).toEqual({
      id: "room-1",
      name: "Test Room",
    });
  });

  it("should close password dialog", () => {
    const { result } = renderHook(() => usePasswordRoom());
    act(() => {
      result.current.openPasswordDialog("room-1", "Test Room");
    });
    act(() => {
      result.current.closePasswordDialog();
    });
    expect(result.current.passwordRoom).toBeNull();
  });

  it("should clear error on open", () => {
    const { result } = renderHook(() => usePasswordRoom());
    act(() => {
      result.current.setPasswordError("some error");
    });
    act(() => {
      result.current.openPasswordDialog("room-1", "Test Room");
    });
    expect(result.current.passwordError).toBe("");
  });

  it("should save password and return roomId", () => {
    const { result } = renderHook(() => usePasswordRoom());
    act(() => {
      result.current.openPasswordDialog("room-1", "Test Room");
    });
    let roomId: string | null | undefined;
    act(() => {
      roomId = result.current.savePasswordAndNavigate("pass123");
    });
    expect(roomId).toBe("room-1");
    expect(sessionStorage.getItem("kill-live:room-pw:room-1")).toBe("pass123");
    expect(result.current.passwordRoom).toBeNull();
  });

  it("should return undefined when no room is set", () => {
    const { result } = renderHook(() => usePasswordRoom());
    let roomId: string | null | undefined;
    act(() => {
      roomId = result.current.savePasswordAndNavigate("pass123");
    });
    expect(roomId).toBeUndefined();
  });
});

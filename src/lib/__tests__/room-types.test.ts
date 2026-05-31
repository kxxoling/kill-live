import { describe, expect, it } from "vitest";
import { normalizeRoomConfig, ROOM_PASSWORD_STORAGE_KEY } from "../room-types";

describe("normalizeRoomConfig", () => {
  it("should return default config when null", () => {
    const config = normalizeRoomConfig(null);
    expect(config).toEqual({
      maxParticipants: 50,
      enableChat: true,
      enableVideo: true,
      enableAudio: true,
    });
  });

  it("should return default config when undefined", () => {
    const config = normalizeRoomConfig(undefined as unknown as null);
    expect(config).toEqual({
      maxParticipants: 50,
      enableChat: true,
      enableVideo: true,
      enableAudio: true,
    });
  });

  it("should merge partial config with defaults", () => {
    const config = normalizeRoomConfig({ maxParticipants: 100 });
    expect(config.maxParticipants).toBe(100);
    expect(config.enableChat).toBe(true);
    expect(config.enableVideo).toBe(true);
    expect(config.enableAudio).toBe(true);
  });

  it("should handle all fields", () => {
    const input = {
      maxParticipants: 25,
      enableChat: false,
      enableVideo: false,
      enableAudio: false,
    };
    const config = normalizeRoomConfig(input);
    expect(config).toEqual(input);
  });
});

describe("ROOM_PASSWORD_STORAGE_KEY", () => {
  it("should generate correct storage key", () => {
    const key = ROOM_PASSWORD_STORAGE_KEY("test-room");
    expect(key).toBe("kill-live:room-pw:test-room");
  });

  it("should handle different room ids", () => {
    const key1 = ROOM_PASSWORD_STORAGE_KEY("room-1");
    const key2 = ROOM_PASSWORD_STORAGE_KEY("room-2");
    expect(key1).not.toBe(key2);
  });
});

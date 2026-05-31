import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  createRoomSchema,
  profileSchema,
  roomListSchema,
  usernameSchema,
} from "../schemas";

describe("createRoomSchema", () => {
  it("should validate a valid room", () => {
    const result = createRoomSchema.safeParse({ name: "Test Room" });
    expect(result.success).toBe(true);
  });

  it("should reject name too short", () => {
    const result = createRoomSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("should reject name too long", () => {
    const result = createRoomSchema.safeParse({ name: "A".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("should accept optional fields", () => {
    const result = createRoomSchema.safeParse({
      name: "Room",
      description: "desc",
      password: "1234",
      config: { maxParticipants: 10, enableChat: true },
    });
    expect(result.success).toBe(true);
  });

  it("should reject password too short", () => {
    const result = createRoomSchema.safeParse({ name: "Room", password: "12" });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = createRoomSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("should validate valid name", () => {
    const result = usernameSchema.safeParse({ name: "John" });
    expect(result.success).toBe(true);
  });

  it("should reject name too short", () => {
    const result = usernameSchema.safeParse({ name: "J" });
    expect(result.success).toBe(false);
  });

  it("should reject name too long", () => {
    const result = usernameSchema.safeParse({ name: "A".repeat(51) });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("should validate name only", () => {
    const result = profileSchema.safeParse({ name: "John" });
    expect(result.success).toBe(true);
  });

  it("should validate name and username", () => {
    const result = profileSchema.safeParse({ name: "John", username: "john_doe" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid username chars", () => {
    const result = profileSchema.safeParse({ name: "John", username: "john doe" });
    expect(result.success).toBe(false);
  });

  it("should reject username too short", () => {
    const result = profileSchema.safeParse({ name: "John", username: "ab" });
    expect(result.success).toBe(false);
  });

  it("should allow empty string username", () => {
    const result = profileSchema.safeParse({ name: "John", username: "" });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("should validate matching passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old12345",
      newPassword: "new12345",
      confirmPassword: "new12345",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old12345",
      newPassword: "new12345",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "new12345",
      confirmPassword: "new12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("roomListSchema", () => {
  it("should parse valid room list", () => {
    const data = [
      {
        id: "1",
        name: "Room 1",
        description: null,
        hasPassword: false,
        participantCount: 5,
        config: null,
      },
    ];
    const result = roomListSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].participantCount).toBe(5);
    }
  });

  it("should parse empty list", () => {
    const result = roomListSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("should coerce participantCount from string", () => {
    const data = [
      {
        id: "1",
        name: "Room",
        description: null,
        hasPassword: false,
        participantCount: "10",
        config: null,
      },
    ];
    const result = roomListSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].participantCount).toBe(10);
    }
  });
});

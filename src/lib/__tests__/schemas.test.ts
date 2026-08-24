import { describe, expect, it } from "vitest";
import {
  adminRoomPasswordSchema,
  changePasswordSchema,
  createMessageSchema,
  createRoomSchema,
  joinRoomSchema,
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

  it("should accept empty password string", () => {
    const result = createRoomSchema.safeParse({ name: "Room", password: "" });
    expect(result.success).toBe(true);
  });

  it("should accept undefined password", () => {
    const result = createRoomSchema.safeParse({ name: "Room" });
    expect(result.success).toBe(true);
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

describe("joinRoomSchema", () => {
  it("should require roomId", () => {
    expect(joinRoomSchema.safeParse({}).success).toBe(false);
  });

  it("should accept roomId with optional password", () => {
    expect(joinRoomSchema.safeParse({ roomId: "r1" }).success).toBe(true);
    expect(joinRoomSchema.safeParse({ roomId: "r1", password: "pw" }).success).toBe(true);
  });
});

describe("createMessageSchema", () => {
  it("should require content and roomId", () => {
    expect(createMessageSchema.safeParse({ content: "hi" }).success).toBe(false);
    expect(createMessageSchema.safeParse({ roomId: "r1" }).success).toBe(false);
    expect(createMessageSchema.safeParse({ content: "hi", roomId: "r1" }).success).toBe(true);
  });

  it("should cap content length", () => {
    expect(createMessageSchema.safeParse({ content: "x".repeat(4001), roomId: "r1" }).success).toBe(
      false,
    );
  });

  it("should reject unknown message types", () => {
    expect(
      createMessageSchema.safeParse({ content: "hi", roomId: "r1", type: "bomb" }).success,
    ).toBe(false);
  });
});

describe("adminRoomPasswordSchema", () => {
  it("should require id", () => {
    expect(adminRoomPasswordSchema.safeParse({ password: "secret1" }).success).toBe(false);
  });

  it("should accept null or 6+ char passwords", () => {
    expect(adminRoomPasswordSchema.safeParse({ id: "r1", password: null }).success).toBe(true);
    expect(adminRoomPasswordSchema.safeParse({ id: "r1", password: "secret1" }).success).toBe(true);
    expect(adminRoomPasswordSchema.safeParse({ id: "r1", password: "abc" }).success).toBe(false);
  });
});

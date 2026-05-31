import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rooms: { findFirst: vi.fn(), findMany: vi.fn() },
  participants: { findFirst: vi.fn() },
  users: { findFirst: vi.fn(), findMany: vi.fn() },
  accounts: { findFirst: vi.fn() },
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      rooms: mocks.rooms,
      roomParticipants: mocks.participants,
      users: mocks.users,
      accounts: mocks.accounts,
    },
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.delete,
  },
}));

vi.mock("@/db/schema", () => ({
  rooms: {
    id: "id",
    name: "name",
    password: "password",
    createdAt: "created_at",
  },
  roomParticipants: {
    id: "id",
    roomId: "room_id",
    userId: "user_id",
    role: "role",
    joinedAt: "joined_at",
    leftAt: "left_at",
  },
  users: { id: "id", name: "name", email: "email" },
  accounts: {
    id: "id",
    userId: "user_id",
    providerId: "provider_id",
    password: "password",
  },
}));

import {
  adminDeleteRoom,
  adminGetRooms,
  adminUpdateRoomPassword,
  cleanupStaleParticipants,
  createRoom,
  getAllRooms,
  getParticipants,
  hashRoomPassword,
  joinRoom,
  leaveRoom,
  manageParticipant,
} from "@/services/room-service";
import {
  adminDeleteUser,
  adminGetUsers,
  changePassword,
  getUser,
  updateUser,
} from "@/services/user-service";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.participants.findFirst.mockResolvedValue(null);
  mocks.rooms.findFirst.mockResolvedValue(null);
  mocks.users.findFirst.mockResolvedValue(null);
  mocks.accounts.findFirst.mockResolvedValue(null);
  mocks.select.mockImplementation(() => {
    const chainable = {
      orderBy: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve([])) })),
      groupBy: vi.fn(() => Promise.resolve([{ count: 0 }])),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve([{ count: 0 }]).then(resolve as (v: unknown) => unknown),
    };
    return {
      from: vi.fn(() => ({
        where: vi.fn(() => chainable),
        leftJoin: vi.fn(() => ({
          groupBy: vi.fn(() => Promise.resolve([])),
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    };
  });
  mocks.insert.mockReturnValue({
    values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([{}])) })),
  });
  mocks.update.mockReturnValue({
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
      returning: vi.fn(() => Promise.resolve([])),
    })),
  });
  mocks.delete.mockReturnValue({ where: vi.fn(() => Promise.resolve()) });
});

describe("room-service", () => {
  it("should hash with bcrypt prefix", async () => {
    const hash = await hashRoomPassword("test123");
    expect(hash).toMatch(/^bcrypt:\$2[aby]?\$/);
  });

  describe("joinRoom", () => {
    it("should return NOT_FOUND", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce(null);
      expect(await joinRoom({ roomId: "x", userId: "u-1" })).toEqual({
        ok: false,
        code: "NOT_FOUND",
      });
    });

    it("should return PASSWORD_REQUIRED", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: "h",
        ownerId: "o",
        createdBy: "o",
      });
      expect(await joinRoom({ roomId: "r", userId: "u-1" })).toEqual({
        ok: false,
        code: "PASSWORD_REQUIRED",
      });
    });

    it("should return WRONG_PASSWORD", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: await hashRoomPassword("right"),
        ownerId: "o",
        createdBy: "o",
      });
      expect(await joinRoom({ roomId: "r", userId: "u-1", password: "wrong" })).toEqual({
        ok: false,
        code: "WRONG_PASSWORD",
      });
    });

    it("should accept correct password", async () => {
      const hash = await hashRoomPassword("pw");
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: hash,
        ownerId: "o",
        createdBy: "o",
        config: null,
      });
      mocks.participants.findFirst.mockResolvedValueOnce(null);
      expect(await joinRoom({ roomId: "r", userId: "u-1", password: "pw" })).toEqual({
        ok: true,
        alreadyActive: false,
      });
    });

    it("should allow owner to skip password", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: "h",
        ownerId: "u-1",
        createdBy: "u-1",
        config: null,
      });
      mocks.participants.findFirst.mockResolvedValueOnce(null);
      expect(await joinRoom({ roomId: "r", userId: "u-1" })).toEqual({
        ok: true,
        alreadyActive: false,
      });
    });

    it("should return alreadyActive", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: null,
        ownerId: "u-1",
        createdBy: "u-1",
      });
      mocks.participants.findFirst.mockResolvedValueOnce({
        id: "p-1",
        role: "owner",
      });
      expect(await joinRoom({ roomId: "r", userId: "u-1" })).toEqual({
        ok: true,
        alreadyActive: true,
      });
    });

    it("should return ROOM_FULL", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: null,
        ownerId: "o",
        createdBy: "o",
        config: { maxParticipants: 2 },
      });
      mocks.participants.findFirst.mockResolvedValueOnce(null);
      mocks.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            const r = Promise.resolve([{ count: 2 }]);
            return { then: r.then.bind(r), groupBy: vi.fn(() => r) };
          }),
        })),
      });
      expect(await joinRoom({ roomId: "r", userId: "u-1" })).toEqual({
        ok: false,
        code: "ROOM_FULL",
      });
    });

    it("should reactivate past participant", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({
        id: "r",
        password: null,
        ownerId: "o",
        createdBy: "o",
        config: { maxParticipants: 50 },
      });
      mocks.participants.findFirst.mockResolvedValueOnce(null);
      mocks.select
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => {
              const r = Promise.resolve([{ count: 1 }]);
              return { then: r.then.bind(r) };
            }),
          })),
        })
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve([{ id: "p-old", leftAt: new Date() }])),
              })),
            })),
          })),
        });
      expect(await joinRoom({ roomId: "r", userId: "u-1" })).toEqual({
        ok: true,
        alreadyActive: false,
      });
      expect(mocks.update).toHaveBeenCalled();
    });
  });

  it("leaveRoom should update leftAt", async () => {
    mocks.update.mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
    });
    await leaveRoom("r", "u-1");
    expect(mocks.update).toHaveBeenCalled();
  });

  it("getAllRooms should return rooms", async () => {
    mocks.select.mockReturnValue({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          groupBy: vi.fn(() => Promise.resolve([{ id: "r-1", name: "R", participantCount: 5 }])),
        })),
      })),
    });
    expect((await getAllRooms())[0].name).toBe("R");
  });

  describe("createRoom", () => {
    it("without password", async () => {
      mocks.insert
        .mockReturnValueOnce({
          values: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: "nr", name: "T", password: null }])),
          })),
        })
        .mockReturnValueOnce({ values: vi.fn(() => Promise.resolve()) });
      expect((await createRoom({ name: "T", userId: "u-1" })).hasPassword).toBe(false);
    });

    it("with password", async () => {
      mocks.insert
        .mockReturnValueOnce({
          values: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: "nr", name: "T", password: "h" }])),
          })),
        })
        .mockReturnValueOnce({ values: vi.fn(() => Promise.resolve()) });
      expect(
        (await createRoom({ name: "T", password: "secret123", userId: "u-1" })).hasPassword,
      ).toBe(true);
    });
  });

  it("getParticipants should return active", async () => {
    mocks.select.mockReturnValue({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: "p-1" }])),
        })),
      })),
    });
    expect(await getParticipants("r")).toHaveLength(1);
  });

  describe("manageParticipant", () => {
    it("FORBIDDEN for member", async () => {
      mocks.participants.findFirst.mockResolvedValueOnce({ role: "member" });
      await expect(
        manageParticipant({
          roomId: "r",
          requesterId: "a",
          targetUserId: "b",
          action: "kick",
        }),
      ).rejects.toThrow("FORBIDDEN");
    });

    it("FORBIDDEN for null", async () => {
      mocks.participants.findFirst.mockResolvedValueOnce(null);
      await expect(
        manageParticipant({
          roomId: "r",
          requesterId: "a",
          targetUserId: "b",
          action: "kick",
        }),
      ).rejects.toThrow("FORBIDDEN");
    });

    it("NOT_FOUND for missing target", async () => {
      mocks.participants.findFirst
        .mockResolvedValueOnce({ id: "1", role: "admin" })
        .mockResolvedValueOnce(null);
      await expect(
        manageParticipant({
          roomId: "r",
          requesterId: "a",
          targetUserId: "b",
          action: "kick",
        }),
      ).rejects.toThrow("NOT_FOUND");
    });

    it("CANNOT_MANAGE_OWNER", async () => {
      mocks.participants.findFirst
        .mockResolvedValueOnce({ id: "1", role: "admin" })
        .mockResolvedValueOnce({ id: "2", role: "owner" });
      await expect(
        manageParticipant({
          roomId: "r",
          requesterId: "a",
          targetUserId: "b",
          action: "kick",
        }),
      ).rejects.toThrow("CANNOT_MANAGE_OWNER");
    });

    it("kick success", async () => {
      mocks.participants.findFirst
        .mockResolvedValueOnce({ id: "1", role: "admin" })
        .mockResolvedValueOnce({ id: "2", role: "member" });
      mocks.update.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      });
      await manageParticipant({
        roomId: "r",
        requesterId: "a",
        targetUserId: "b",
        action: "kick",
      });
      expect(mocks.update).toHaveBeenCalled();
    });

    it("setRole success", async () => {
      mocks.participants.findFirst
        .mockResolvedValueOnce({ id: "1", role: "owner" })
        .mockResolvedValueOnce({ id: "2", role: "member" });
      mocks.update.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      });
      await manageParticipant({
        roomId: "r",
        requesterId: "a",
        targetUserId: "b",
        action: "setRole",
        role: "admin",
      });
      expect(mocks.update).toHaveBeenCalled();
    });

    it("INVALID_ROLE", async () => {
      mocks.participants.findFirst
        .mockResolvedValueOnce({ id: "1", role: "owner" })
        .mockResolvedValueOnce({ id: "2", role: "member" });
      await expect(
        manageParticipant({
          roomId: "r",
          requesterId: "a",
          targetUserId: "b",
          action: "setRole",
          role: "super",
        }),
      ).rejects.toThrow("INVALID_ROLE");
    });
  });

  it("cleanupStaleParticipants", async () => {
    mocks.update.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: "1" }, { id: "2" }])),
        })),
      })),
    });
    expect(await cleanupStaleParticipants()).toHaveLength(2);
  });

  it("adminGetRooms", async () => {
    mocks.rooms.findMany.mockResolvedValueOnce([
      {
        id: "1",
        name: "A",
        description: "d",
        password: null,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "B",
        description: null,
        password: "h",
        createdAt: new Date(),
      },
    ]);
    const r = await adminGetRooms();
    expect(r).toHaveLength(2);
    expect(r[0].hasPassword).toBe(false);
    expect(r[1].hasPassword).toBe(true);
  });

  describe("adminUpdateRoomPassword", () => {
    it("with password", async () => {
      mocks.update.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      });
      await adminUpdateRoomPassword("r", "p");
      expect(mocks.update).toHaveBeenCalled();
    });

    it("with null", async () => {
      mocks.update.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      });
      await adminUpdateRoomPassword("r", null);
      expect(mocks.update).toHaveBeenCalled();
    });
  });

  describe("adminDeleteRoom", () => {
    it("NOT_FOUND", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce(null);
      await expect(adminDeleteRoom("x")).rejects.toThrow("NOT_FOUND");
    });

    it("deletes", async () => {
      mocks.rooms.findFirst.mockResolvedValueOnce({ id: "r" });
      mocks.delete.mockReturnValue({ where: vi.fn(() => Promise.resolve()) });
      await adminDeleteRoom("r");
      expect(mocks.delete).toHaveBeenCalled();
    });
  });
});

describe("user-service", () => {
  it("getUser null", async () => {
    mocks.users.findFirst.mockResolvedValueOnce(null);
    expect(await getUser("x")).toBeNull();
  });

  it("getUser found", async () => {
    mocks.users.findFirst.mockResolvedValueOnce({
      id: "u",
      name: "T",
      email: "e",
      username: "t",
      image: null,
    });
    expect(await getUser("u")).toEqual({
      id: "u",
      name: "T",
      email: "e",
      username: "t",
      image: null,
    });
  });

  it("updateUser", async () => {
    mocks.update.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: "u", name: "N" }])),
        })),
      })),
    });
    expect((await updateUser("u", { name: "N" })).name).toBe("N");
  });

  describe("changePassword", () => {
    it("too short", async () => {
      await expect(changePassword("u", "o", "sh")).rejects.toThrow("PASSWORD_TOO_SHORT");
    });

    it("no account", async () => {
      mocks.accounts.findFirst.mockResolvedValueOnce(null);
      await expect(changePassword("u", "o12345678", "n12345678")).rejects.toThrow(
        "NO_PASSWORD_SET",
      );
    });

    it("no password", async () => {
      mocks.accounts.findFirst.mockResolvedValueOnce({
        id: "a",
        password: null,
      });
      await expect(changePassword("u", "o12345678", "n12345678")).rejects.toThrow(
        "NO_PASSWORD_SET",
      );
    });

    it("wrong password", async () => {
      mocks.accounts.findFirst.mockResolvedValueOnce({
        id: "a",
        password: await bcrypt.hash("right", 12),
      });
      await expect(changePassword("u", "wrong12345", "new12345678")).rejects.toThrow(
        "WRONG_PASSWORD",
      );
    });

    it("success", async () => {
      mocks.accounts.findFirst.mockResolvedValueOnce({
        id: "a",
        password: await bcrypt.hash("old12345678", 12),
      });
      mocks.update.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      });
      await changePassword("u", "old12345678", "new12345678");
      expect(mocks.update).toHaveBeenCalled();
    });
  });

  it("adminGetUsers", async () => {
    mocks.users.findMany.mockResolvedValueOnce([{ id: "1" }, { id: "2" }]);
    expect(await adminGetUsers()).toHaveLength(2);
  });

  describe("adminDeleteUser", () => {
    it("NOT_FOUND", async () => {
      mocks.users.findFirst.mockResolvedValueOnce(null);
      await expect(adminDeleteUser("x")).rejects.toThrow("NOT_FOUND");
    });

    it("deletes", async () => {
      mocks.users.findFirst.mockResolvedValueOnce({ id: "u" });
      mocks.delete.mockReturnValue({ where: vi.fn(() => Promise.resolve()) });
      await adminDeleteUser("u");
      expect(mocks.delete).toHaveBeenCalled();
    });
  });
});

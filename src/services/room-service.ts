import bcrypt from "bcryptjs";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { roomParticipants, rooms, users } from "@/db/schema";
import { normalizeRoomConfig, type RoomConfig } from "@/lib/room-types";

const BCRYPT_PREFIX = "bcrypt:";

export async function hashRoomPassword(plain: string): Promise<string> {
  const hash = await bcrypt.hash(plain, 10);
  return `${BCRYPT_PREFIX}${hash}`;
}

async function verifyRoomPassword(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) return true;
  if (stored.startsWith(BCRYPT_PREFIX)) {
    return bcrypt.compare(plain, stored.slice(BCRYPT_PREFIX.length));
  }
  return plain === stored;
}

async function countActiveParticipants(roomId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(roomParticipants)
    .where(and(eq(roomParticipants.roomId, roomId), isNull(roomParticipants.leftAt)));
  return Number(row?.count ?? 0);
}

function isRoomOwner(
  room: { ownerId: string | null; createdBy: string | null },
  userId: string,
): boolean {
  return room.ownerId === userId || room.createdBy === userId;
}

export type JoinRoomResult =
  | { ok: true; alreadyActive: boolean }
  | {
      ok: false;
      code: "NOT_FOUND" | "PASSWORD_REQUIRED" | "WRONG_PASSWORD" | "ROOM_FULL";
    };

export async function joinRoom(params: {
  roomId: string;
  userId: string;
  password?: string;
}): Promise<JoinRoomResult> {
  const { roomId, userId, password } = params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const owner = isRoomOwner(room, userId);

  if (room.password && !owner) {
    if (!password) {
      return { ok: false, code: "PASSWORD_REQUIRED" };
    }
    const valid = await verifyRoomPassword(password, room.password);
    if (!valid) {
      return { ok: false, code: "WRONG_PASSWORD" };
    }
    if (!room.password.startsWith(BCRYPT_PREFIX)) {
      await db
        .update(rooms)
        .set({ password: await hashRoomPassword(password) })
        .where(eq(rooms.id, roomId));
    }
  }

  const active = await db.query.roomParticipants.findFirst({
    where: and(
      eq(roomParticipants.roomId, roomId),
      eq(roomParticipants.userId, userId),
      isNull(roomParticipants.leftAt),
    ),
  });

  if (active) {
    return { ok: true, alreadyActive: true };
  }

  const config = normalizeRoomConfig(room.config as RoomConfig | null);
  const count = await countActiveParticipants(roomId);
  if (count >= (config.maxParticipants ?? 50)) {
    return { ok: false, code: "ROOM_FULL" };
  }

  const pastRows = await db
    .select()
    .from(roomParticipants)
    .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)))
    .orderBy(desc(roomParticipants.joinedAt))
    .limit(1);

  const past = pastRows[0];

  if (past) {
    await db
      .update(roomParticipants)
      .set({ leftAt: null, joinedAt: new Date() })
      .where(eq(roomParticipants.id, past.id));
    return { ok: true, alreadyActive: false };
  }

  await db.insert(roomParticipants).values({
    id: crypto.randomUUID(),
    userId,
    roomId,
    role: owner ? "owner" : "member",
  });

  return { ok: true, alreadyActive: false };
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await db
    .update(roomParticipants)
    .set({ leftAt: new Date() })
    .where(
      and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId),
        isNull(roomParticipants.leftAt),
      ),
    );
}

export async function getAllRooms() {
  return db
    .select({
      id: rooms.id,
      name: rooms.name,
      description: rooms.description,
      hasPassword: sql<boolean>`${rooms.password} IS NOT NULL`,
      createdBy: rooms.createdBy,
      ownerId: rooms.ownerId,
      config: rooms.config,
      createdAt: rooms.createdAt,
      updatedAt: rooms.updatedAt,
      participantCount: sql<number>`count(distinct ${roomParticipants.id})`,
    })
    .from(rooms)
    .leftJoin(
      roomParticipants,
      and(eq(rooms.id, roomParticipants.roomId), isNull(roomParticipants.leftAt)),
    )
    .groupBy(rooms.id);
}

export async function createRoom(params: {
  name: string;
  description?: string;
  password?: string;
  config?: RoomConfig;
  userId: string;
}) {
  const roomId = crypto.randomUUID();
  const storedPassword = params.password ? await hashRoomPassword(params.password) : null;

  const newRoom = await db
    .insert(rooms)
    .values({
      id: roomId,
      name: params.name,
      description: params.description ?? null,
      password: storedPassword,
      createdBy: params.userId,
      ownerId: params.userId,
      config: params.config || {
        maxParticipants: 50,
        enableChat: true,
        enableVideo: true,
        enableAudio: true,
      },
    })
    .returning();

  await db.insert(roomParticipants).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    roomId,
    role: "owner",
  });

  const { password: _, ...roomWithoutPassword } = newRoom[0];
  return {
    ...roomWithoutPassword,
    hasPassword: !!params.password,
  };
}

export async function getParticipants(roomId: string) {
  return db
    .select({
      id: roomParticipants.id,
      userId: roomParticipants.userId,
      roomId: roomParticipants.roomId,
      role: roomParticipants.role,
      joinedAt: roomParticipants.joinedAt,
      user: {
        name: users.name,
        image: users.image,
      },
    })
    .from(roomParticipants)
    .leftJoin(users, eq(roomParticipants.userId, users.id))
    .where(and(eq(roomParticipants.roomId, roomId), isNull(roomParticipants.leftAt)));
}

export async function manageParticipant(params: {
  roomId: string;
  requesterId: string;
  targetUserId: string;
  action: "kick" | "setRole";
  role?: string;
}) {
  const { roomId, requesterId, targetUserId, action, role } = params;

  const requester = await db.query.roomParticipants.findFirst({
    where: and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, requesterId)),
  });

  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new Error("FORBIDDEN");
  }

  const target = await db.query.roomParticipants.findFirst({
    where: and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, targetUserId)),
  });

  if (!target) {
    throw new Error("NOT_FOUND");
  }

  if (target.role === "owner" && requester.role !== "owner") {
    throw new Error("CANNOT_MANAGE_OWNER");
  }

  if (action === "kick") {
    await db
      .update(roomParticipants)
      .set({ leftAt: new Date() })
      .where(eq(roomParticipants.id, target.id));
  } else if (action === "setRole") {
    if (role !== "admin" && role !== "member") {
      throw new Error("INVALID_ROLE");
    }
    await db.update(roomParticipants).set({ role }).where(eq(roomParticipants.id, target.id));
  }
}

export async function cleanupStaleParticipants() {
  return db
    .update(roomParticipants)
    .set({ leftAt: new Date() })
    .where(isNull(roomParticipants.leftAt))
    .returning();
}

export async function adminGetRooms() {
  const allRooms = await db.query.rooms.findMany({
    orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
  });
  return allRooms.map((room) => ({
    id: room.id,
    name: room.name,
    description: room.description,
    hasPassword: !!room.password,
    createdAt: room.createdAt,
  }));
}

export async function adminUpdateRoomPassword(id: string, password: string | null) {
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
  await db.update(rooms).set({ password: hashedPassword }).where(eq(rooms.id, id));
}

export async function adminDeleteRoom(id: string) {
  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) });
  if (!room) throw new Error("NOT_FOUND");
  await db.delete(rooms).where(eq(rooms.id, id));
}

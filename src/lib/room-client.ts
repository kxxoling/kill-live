import { ROOM_PASSWORD_STORAGE_KEY } from "@/lib/room-types";

export type RoomJoinStatus = "idle" | "joining" | "joined" | "password" | "full" | "error";

export async function postRoomJoin(roomId: string, password?: string) {
  const res = await fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function mapJoinResponse(
  data: { code?: string; error?: string },
  ok: boolean,
): { status: RoomJoinStatus; error: string } {
  if (ok) {
    return { status: "joined", error: "" };
  }
  if (data.code === "PASSWORD_REQUIRED" || data.code === "WRONG_PASSWORD") {
    return {
      status: "password",
      error: data.error || "Incorrect password",
    };
  }
  if (data.code === "ROOM_FULL") {
    return { status: "full", error: data.error || "Room is full" };
  }
  return { status: "error", error: data.error || "Failed to join room" };
}

export async function joinRoomClient(roomId: string, password?: string) {
  const stored = password ?? sessionStorage.getItem(ROOM_PASSWORD_STORAGE_KEY(roomId));
  const { ok, data } = await postRoomJoin(roomId, stored ?? undefined);
  if (ok) {
    sessionStorage.removeItem(ROOM_PASSWORD_STORAGE_KEY(roomId));
  }
  return { ...mapJoinResponse(data, ok), ok };
}

export function leaveRoomClient(roomId: string) {
  return fetch("/api/rooms/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
    keepalive: true,
  });
}

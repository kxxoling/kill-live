import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { joinRoom } from "@/services/room-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, password } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const result = await joinRoom({
      roomId,
      userId: session.user.id,
      password,
    });

    if (!result.ok) {
      const messages: Record<typeof result.code, string> = {
        NOT_FOUND: "Room not found",
        PASSWORD_REQUIRED: "Room password is required",
        WRONG_PASSWORD: "Incorrect password",
        ROOM_FULL: "Room is full",
      };
      const status = result.code === "NOT_FOUND" ? 404 : result.code === "ROOM_FULL" ? 409 : 403;
      return NextResponse.json({ error: messages[result.code], code: result.code }, { status });
    }

    return NextResponse.json({
      success: true,
      roomId,
      alreadyActive: result.alreadyActive,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}

import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { leaveRoomSchema } from "@/lib/schemas";
import { leaveRoom } from "@/services/room-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = leaveRoomSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const { roomId } = parsed.data;

    await leaveRoom(roomId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
  }
}

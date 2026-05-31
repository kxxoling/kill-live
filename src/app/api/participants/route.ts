import { type NextRequest, NextResponse } from "next/server";
import { getParticipants } from "@/services/room-service";

export async function GET(req: NextRequest) {
  try {
    const roomId = new URL(req.url).searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const participants = await getParticipants(roomId);
    return NextResponse.json(participants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}

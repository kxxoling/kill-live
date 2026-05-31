import { NextResponse } from "next/server";
import { adminDeleteRoom, adminGetRooms, adminUpdateRoomPassword } from "@/services/room-service";

export async function GET() {
  try {
    const rooms = await adminGetRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, password } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    await adminUpdateRoomPassword(id, password ?? null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update room:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    await adminDeleteRoom(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: msg === "NOT_FOUND" ? 404 : 500 });
  }
}

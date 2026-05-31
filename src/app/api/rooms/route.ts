import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRoom, getAllRooms } from "@/services/room-service";

export async function GET() {
  try {
    const allRooms = await getAllRooms();
    return NextResponse.json(allRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, password, config } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    const room = await createRoom({
      name,
      description,
      password,
      config,
      userId: session.user.id,
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

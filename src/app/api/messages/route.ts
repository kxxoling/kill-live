import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMessageSchema } from "@/lib/schemas";
import { createMessage, getRoomMessages } from "@/services/message";
import { hasRoomParticipation, isRoomParticipant } from "@/services/room-service";

// Get messages for a room
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const afterParam = searchParams.get("after");
    const afterDate = afterParam ? new Date(afterParam) : null;
    const after = afterDate && !Number.isNaN(afterDate.getTime()) ? afterDate : null;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    // Reading history is allowed for past and current participants alike.
    if (!(await hasRoomParticipation(roomId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roomMessages = await getRoomMessages(roomId, limit, offset, after);
    return NextResponse.json(roomMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// Create a new message
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createMessageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Content and room ID are required" },
        { status: 400 },
      );
    }

    const { content, roomId, type, fileKey, fileName, fileSize } = parsed.data;

    if (!(await isRoomParticipant(roomId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await createMessage({
      content,
      roomId,
      userId: session.user.id,
      type,
      fileKey,
      fileName,
      fileSize,
    });

    if (!message) {
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}

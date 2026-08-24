import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createMessageSchema } from "@/lib/schemas";
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

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    // Reading history is allowed for past and current participants alike.
    if (!(await hasRoomParticipation(roomId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roomMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        fileUrl: messages.fileUrl,
        fileName: messages.fileName,
        fileSize: messages.fileSize,
        userId: messages.userId,
        roomId: messages.roomId,
        createdAt: messages.createdAt,
        user: {
          name: users.name,
          image: users.image,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(roomMessages.reverse());
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

    const messageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: messageId,
      content,
      type: type || "text",
      fileUrl: fileKey ? `/uploads/${fileKey}` : null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      userId: session.user.id,
      roomId,
    });

    // Fetch the inserted message with user info
    const fullMessage = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        fileUrl: messages.fileUrl,
        fileName: messages.fileName,
        fileSize: messages.fileSize,
        userId: messages.userId,
        roomId: messages.roomId,
        createdAt: messages.createdAt,
        user: {
          name: users.name,
          image: users.image,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, messageId));

    return NextResponse.json(fullMessage[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}

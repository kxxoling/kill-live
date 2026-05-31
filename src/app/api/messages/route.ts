import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { auth } from "@/lib/auth";

// Get messages for a room
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
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

    const body = await req.json();
    const { content, roomId, type, fileUrl, fileName, fileSize } = body;

    if (!content || !roomId) {
      return NextResponse.json({ error: "Content and room ID are required" }, { status: 400 });
    }

    const messageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: messageId,
      content,
      type: type || "text",
      fileUrl: fileUrl || null,
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

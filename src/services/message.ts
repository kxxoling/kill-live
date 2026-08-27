import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";

const messageWithUser = {
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
};

async function getMessageById(id: string) {
  const rows = await db
    .select(messageWithUser)
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export type MessageWithUser = NonNullable<Awaited<ReturnType<typeof getMessageById>>>;

/** Messages of a room, oldest first. With `after`, only messages newer than that timestamp. */
export async function getRoomMessages(
  roomId: string,
  limit: number,
  offset: number,
  after?: Date | null,
) {
  const rows = await db
    .select(messageWithUser)
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(
      after
        ? and(eq(messages.roomId, roomId), gt(messages.createdAt, after))
        : eq(messages.roomId, roomId),
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.reverse();
}

export async function createMessage(input: {
  content: string;
  roomId: string;
  userId: string;
  type?: string;
  fileKey?: string;
  fileName?: string | null;
  fileSize?: number | null;
}) {
  const id = crypto.randomUUID();
  await db.insert(messages).values({
    id,
    content: input.content,
    type: (input.type || "text") as MessageWithUser["type"],
    fileUrl: input.fileKey ? `/uploads/${input.fileKey}` : null,
    fileName: input.fileName || null,
    fileSize: input.fileSize || null,
    userId: input.userId,
    roomId: input.roomId,
  });
  return getMessageById(id);
}

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RoomContent } from "@/components/room-content";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { isS3Configured } from "@/lib/config";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;

  // Check if room exists
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
  });

  if (!room) {
    notFound();
  }

  // Pass necessary env variables to client
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
  const enableUpload = isS3Configured();

  return (
    <RoomContent
      roomId={id}
      roomName={room.name}
      livekitUrl={livekitUrl}
      hasPassword={!!room.password}
      roomConfig={room.config}
      enableUpload={enableUpload}
    />
  );
}

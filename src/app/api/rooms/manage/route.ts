import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { manageParticipant } from "@/services/room-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, targetUserId, action, role } = await req.json();
    if (!roomId || !targetUserId || !action) {
      return NextResponse.json(
        { error: "roomId, targetUserId, and action are required" },
        { status: 400 },
      );
    }

    await manageParticipant({
      roomId,
      requesterId: session.user.id,
      targetUserId,
      action,
      role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const statusMap: Record<string, number> = {
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CANNOT_MANAGE_OWNER: 403,
      INVALID_ROLE: 400,
    };
    return NextResponse.json({ error: msg }, { status: statusMap[msg] ?? 500 });
  }
}

import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { manageParticipantSchema } from "@/lib/schemas";
import { manageParticipant } from "@/services/room-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = manageParticipantSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "roomId, targetUserId, and action are required",
        },
        { status: 400 },
      );
    }

    const { roomId, targetUserId, action, role } = parsed.data;

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

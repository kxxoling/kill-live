import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLiveKitToken } from "@/lib/livekit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomName } = body;

    if (!roomName) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    const token = await createLiveKitToken(
      roomName,
      session.user.name || "Anonymous",
      session.user.id,
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creating LiveKit token:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}

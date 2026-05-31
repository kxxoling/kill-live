import { NextResponse } from "next/server";
import { cleanupStaleParticipants } from "@/services/room-service";

export async function POST() {
  try {
    const result = await cleanupStaleParticipants();
    return NextResponse.json({ success: true, updated: result.length });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json({ error: "Failed to cleanup participants" }, { status: 500 });
  }
}

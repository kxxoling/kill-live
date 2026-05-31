import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changePassword } from "@/services/user-service";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    await changePassword(session.user.id, currentPassword, newPassword);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const statusMap: Record<string, number> = {
      PASSWORD_TOO_SHORT: 400,
      NO_PASSWORD_SET: 400,
      WRONG_PASSWORD: 400,
    };
    return NextResponse.json({ error: msg }, { status: statusMap[msg] ?? 500 });
  }
}

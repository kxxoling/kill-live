import { NextResponse } from "next/server";
import { adminDeleteUser, adminGetUsers } from "@/services/user-service";

export async function GET() {
  try {
    const allUsers = await adminGetUsers();
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await adminDeleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: msg === "NOT_FOUND" ? 404 : 500 });
  }
}

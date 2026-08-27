import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/**
 * Decides whether a user counts as an admin: their username must be listed
 * in the ADMIN_USERNAMES env var (comma-separated, case-insensitive).
 * Override or extend this function to change the rule.
 */
export function isAdminUser(username: string | null | undefined): boolean {
  if (!username) return false;
  const adminNames = (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  return adminNames.includes(username.toLowerCase());
}

type AdminGuard = { ok: true; session: Session } | { ok: false; response: NextResponse };

/**
 * Checks that the current request comes from an authenticated admin user.
 */
export async function requireAdmin(): Promise<AdminGuard> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminUser(session.user.username)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}

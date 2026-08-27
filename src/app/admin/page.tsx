import { createHMAC } from "@better-auth/utils/hmac";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin";
import { auth } from "@/lib/auth";
import Dashboard from "./dashboard";

/**
 * Test-only seam for the database-free e2e suite: when E2E_TEST_MODE=1 and
 * the request carries a signed "e2e_admin" cookie, its username is trusted
 * without a DB session. The cookie is HMAC-signed with BETTER_AUTH_SECRET,
 * and the whole path is dead code unless the e2e runner sets the env var.
 */
async function e2eAdminUsername(): Promise<string | null> {
  if (process.env.E2E_TEST_MODE !== "1") return null;
  const raw = (await cookies()).get("e2e_admin")?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const username = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const valid = await createHMAC("SHA-256", "base64urlnopad").verify(
    process.env.BETTER_AUTH_SECRET || "",
    username,
    signature,
  );
  return valid ? username : null;
}

export default async function AdminPage() {
  let username = await e2eAdminUsername();

  if (!username) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      redirect("/?error=admin-auth-required");
    }
    username = session.user.username ?? null;
  }

  if (!isAdminUser(username)) {
    redirect("/?error=admin-forbidden");
  }

  return <Dashboard />;
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin";
import { auth } from "@/lib/auth";
import Dashboard from "./dashboard";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/?error=admin-auth-required");
  }

  if (!isAdminUser(session.user.username)) {
    redirect("/?error=admin-forbidden");
  }

  return <Dashboard />;
}

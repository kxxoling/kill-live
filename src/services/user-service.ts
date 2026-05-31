import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";

export async function getUser(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    image: user.image,
  };
}

export async function updateUser(userId: string, data: { name?: string; username?: string }) {
  const updatedUser = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updatedUser[0];
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")),
  });

  if (!account?.password) {
    throw new Error("NO_PASSWORD_SET");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
  if (!isPasswordValid) {
    throw new Error("WRONG_PASSWORD");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db.update(accounts).set({ password: hashedPassword }).where(eq(accounts.id, account.id));
}

export async function adminGetUsers() {
  return db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export async function adminDeleteUser(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  if (!user) throw new Error("NOT_FOUND");
  await db.delete(users).where(eq(users.id, id));
}

import { anonymousClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [anonymousClient(), usernameClient()],
});

export const { signIn, signOut, useSession } = authClient;

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, username } from "better-auth/plugins";
import { db } from "@/db";
import * as dbSchema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: dbSchema.users,
      session: dbSchema.sessions,
      account: dbSchema.accounts,
      verification: dbSchema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    anonymous({
      emailDomainName: "anonymous.killlive.app",
    }),
    username(),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder",
    },
  },
  user: {
    additionalFields: {
      isAnonymous: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

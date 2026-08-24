import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  LIVEKIT_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_LIVEKIT_URL: z.string().optional(),
  ADMIN_USERNAMES: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

// `next build` evaluates route modules to collect page data, and build
// environments (CI, docker) legitimately have no secrets — skip validation
// there. Nothing connects at build time; runtime still fails fast.
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!parsed.success && !isProductionBuild) {
  const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(
    `Invalid environment configuration. Check these variables in your .env file: ${missing}`,
  );
}

type Env = z.infer<typeof envSchema>;

export const env: Env = parsed.success ? parsed.data : (process.env as unknown as Env);

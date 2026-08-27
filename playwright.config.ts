import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT || "3000";

export default defineConfig({
  testDir: "./playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    env: {
      // Database-free e2e: enable the signed-cookie test seam on the admin
      // page and authorize the username the suite signs in as. The remaining
      // values satisfy startup env validation; nothing connects to them.
      E2E_TEST_MODE: "1",
      ADMIN_USERNAMES: process.env.ADMIN_USERNAMES || "e2e_admin",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "e2e-only-secret",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/killlive-e2e",
      LIVEKIT_API_KEY: "e2e-key",
      LIVEKIT_API_SECRET: "e2e-secret",
      LIVEKIT_URL: "ws://localhost:7880",
    },
  },
});

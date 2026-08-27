import { createHMAC } from "@better-auth/utils/hmac";
import { expect, test } from "@playwright/test";
import { mockAdminRooms } from "./mocks";

test.describe("Admin page", () => {
  // Database-free e2e: the dev server runs with E2E_TEST_MODE=1 (see
  // playwright.config.ts) and accepts an HMAC-signed "e2e_admin" cookie in
  // place of a DB session on the admin page guard.
  const E2E_ADMIN_USERNAME = "e2e_admin";
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
  const e2eSecret = process.env.BETTER_AUTH_SECRET || "e2e-only-secret";

  let adminCookie = "";

  test.beforeAll(async () => {
    const signature = await createHMAC("SHA-256", "base64urlnopad").sign(
      e2eSecret,
      E2E_ADMIN_USERNAME,
    );
    adminCookie = `${E2E_ADMIN_USERNAME}.${signature}`;
  });

  test("should redirect anonymous visitors to home", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/\?error=admin-auth-required/, { timeout: 10000 });
  });

  test("should load admin dashboard for an admin session", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "e2e_admin",
        value: adminCookie,
        url: baseUrl,
      },
    ]);

    await page.route("**/api/admin/rooms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockAdminRooms),
      });
    });

    await page.route("**/api/admin/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto("/admin");
    await expect(page.locator("text=Admin Dashboard")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Room 1")).toBeVisible();
  });
});

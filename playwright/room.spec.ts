import { expect, test } from "@playwright/test";
import { mockRooms } from "./mocks";

test.describe("Room navigation", () => {
  test("should navigate to room on click", async ({ page }) => {
    await page.route("**/api/rooms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRooms),
      });
    });

    await page.goto("/");
    await page.locator("text=General Chat").click();
    await expect(page).toHaveURL(/\/room\//, { timeout: 10000 });
  });

  test("should show password dialog for protected room", async ({ page }) => {
    const protectedRooms = [
      {
        ...mockRooms[0],
        hasPassword: true,
      },
    ];

    await page.route("**/api/rooms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(protectedRooms),
      });
    });

    await page.goto("/");
    await page.locator("text=General Chat").click();
    await expect(page.locator('[placeholder="Enter room password"]')).toBeVisible({
      timeout: 10000,
    });
  });
});

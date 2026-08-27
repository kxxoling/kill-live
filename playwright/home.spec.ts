import { expect, test } from "@playwright/test";
import { mockRooms } from "./mocks";

test.describe("Homepage", () => {
  test("should load homepage with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Kill Live/);
  });

  test("should show room list from API", async ({ page }) => {
    await page.route("**/api/rooms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRooms),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=General Chat")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("text=Gaming")).toBeVisible();
    await expect(page.locator("text=Talk about your favorite games")).toBeVisible();
  });

  test("should show empty state when no rooms", async ({ page }) => {
    await page.route("**/api/rooms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto("/");
    await page.waitForSelector("text=Kill Live", { timeout: 15000 });
  });

  test("should have sign in button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
  });

  test("should have theme toggle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("switch", { name: "Toggle dark mode" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("switch", { name: "Toggle dark mode" });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

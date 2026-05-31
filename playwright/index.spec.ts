import { expect, test } from "@playwright/test";

const mockRooms = [
  {
    id: "general",
    name: "General Chat",
    description: "General discussion room for everyone",
    hasPassword: false,
    participantCount: 0,
    config: {
      enableChat: true,
      enableAudio: true,
      enableVideo: true,
      maxParticipants: 50,
    },
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Talk about your favorite games",
    hasPassword: false,
    participantCount: 3,
    config: {
      enableChat: true,
      enableAudio: true,
      enableVideo: true,
      maxParticipants: 30,
    },
  },
];

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

test.describe("Admin page", () => {
  test("should load admin dashboard", async ({ page }) => {
    await page.route("**/api/admin/rooms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            name: "Room 1",
            description: null,
            hasPassword: false,
            createdAt: new Date().toISOString(),
          },
        ]),
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

import { expect, test } from "@playwright/test";

test.describe("Chat Flow E2E", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("homepage renders correctly with title and input", async ({ page }) => {
		await expect(page.locator("text=Fire Wave")).toBeVisible();
		await expect(page.getByPlaceholder("Ask, Search or Chat...")).toBeVisible();
	});

	test("navigates to chat page on submit", async ({ page }) => {
		await page
			.getByPlaceholder("Ask, Search or Chat...")
			.fill("Search for latest AI news");
		await page.getByRole("button", { name: "Send" }).click();

		await expect(page).toHaveURL(/\/chat\//);
		await expect(page.locator("[data-slot='message-area']")).toBeVisible();
	});

	test("chat page shows resizable panels on desktop", async ({
		page,
		isMobile,
	}) => {
		test.skip(!!isMobile, "Mobile layout differs");

		await page.goto("/chat/test-session-id");

		const panels = page.locator("[data-panel-group]");
		await expect(panels).toBeVisible();
	});

	test("chat page renders empty state message", async ({ page }) => {
		await page.goto("/chat/test-session-id");
		await expect(page.getByText("Send a message to start...")).toBeVisible();
	});

	test("VNC panel shows waiting state initially", async ({ page }) => {
		await page.goto("/chat/test-session-id");

		const vncPanel = page.locator("text=Sandbox Viewer");
		await expect(vncPanel).toBeVisible();

		await expect(page.getByText("Waiting for Agent Sandbox...")).toBeVisible();
	});

	test("sidebar opens and shows chat history", async ({ page }) => {
		await page.goto("/chat/test-session-id");

		const menuButton = page.getByRole("button", { name: "Menu" }).first();
		if (menuButton) {
			await menuButton.click();
			await expect(page.locator("text=Fire Wave")).toBeVisible();
		}
	});
});

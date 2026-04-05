import { expect, test } from "@playwright/test";

test("opens the mobile VNC drawer after an action-driven prompt", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");

	await page
		.getByPlaceholder("Ask the agent to browse, search, click, or summarize...")
		.fill("Search chatgpt.com");
	await page.getByRole("button", { name: "Send" }).click();

	await expect(page.getByText("I opened a browser sandbox")).toBeVisible();
	await page.getByRole("button", { name: "Open VNC Drawer" }).click();

	await expect(page.getByText("Live VNC Stream")).toBeVisible();
});

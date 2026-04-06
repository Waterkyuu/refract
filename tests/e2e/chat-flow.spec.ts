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

test.describe("Chat History Persistence", () => {
	test("creates session in IndexedDB after first message", async ({ page }) => {
		await page.goto("/");

		await page.getByPlaceholder("Ask, Search or Chat...").fill("Hello agent");
		await page.getByRole("button", { name: "Send" }).click();

		await expect(page).toHaveURL(/\/chat\//);

		const hasSession = await page.evaluate(() => {
			return new Promise<boolean>((resolve) => {
				const request = indexedDB.open("firewave-agent-v2");
				request.onsuccess = () => {
					const db = request.result;
					const tx = db.transaction("sessions", "readonly");
					const store = tx.objectStore("sessions");
					const getAll = store.getAll();
					getAll.onsuccess = () => {
						resolve(getAll.result.length > 0);
					};
					getAll.onerror = () => resolve(false);
				};
				request.onerror = () => resolve(false);
			});
		});

		expect(hasSession).toBe(true);
	});

	test("session title matches first user message", async ({ page }) => {
		await page.goto("/");

		await page
			.getByPlaceholder("Ask, Search or Chat...")
			.fill("My test chat title");
		await page.getByRole("button", { name: "Send" }).click();

		await expect(page).toHaveURL(/\/chat\//);

		const title = await page.evaluate(() => {
			return new Promise<string | null>((resolve) => {
				const request = indexedDB.open("firewave-agent-v2");
				request.onsuccess = () => {
					const db = request.result;
					const tx = db.transaction("sessions", "readonly");
					const store = tx.objectStore("sessions");
					const getAll = store.getAll();
					getAll.onsuccess = () => {
						const sessions = getAll.result;
						if (sessions.length > 0) {
							resolve(sessions[0].title);
						}
						resolve(null);
					};
					getAll.onerror = () => resolve(null);
				};
				request.onerror = () => resolve(null);
			});
		});

		expect(title).toBe("My test chat title");
	});

	test("session appears in sidebar after creation", async ({ page }) => {
		await page.goto("/");

		await page
			.getByPlaceholder("Ask, Search or Chat...")
			.fill("Sidebar test chat");
		await page.getByRole("button", { name: "Send" }).click();

		await expect(page).toHaveURL(/\/chat\//);

		await page.getByRole("button", { name: "Menu" }).first().click();

		await expect(page.locator("text=Sidebar test chat")).toBeVisible();
	});

	test("messages are stored in IndexedDB", async ({ page }) => {
		await page.goto("/");

		await page.getByPlaceholder("Ask, Search or Chat...").fill("Storage test");
		await page.getByRole("button", { name: "Send" }).click();

		await expect(page).toHaveURL(/\/chat\//);

		await page.waitForTimeout(2000);

		const messageCount = await page.evaluate(() => {
			return new Promise<number>((resolve) => {
				const request = indexedDB.open("firewave-agent-v2");
				request.onsuccess = () => {
					const db = request.result;
					const tx = db.transaction("messages", "readonly");
					const store = tx.objectStore("messages");
					const getAll = store.getAll();
					getAll.onsuccess = () => {
						resolve(getAll.result.length);
					};
					getAll.onerror = () => resolve(0);
				};
				request.onerror = () => resolve(0);
			});
		});

		expect(messageCount).toBeGreaterThanOrEqual(1);
	});

	test("navigate back to session shows chat history", async ({ page }) => {
		await page.goto("/");

		await page
			.getByPlaceholder("Ask, Search or Chat...")
			.fill("History recall test");
		await page.getByRole("button", { name: "Send" }).click();

		await expect(page).toHaveURL(/\/chat\//);
		const chatUrl = page.url();

		await page.waitForTimeout(2000);

		await page.goto("/");
		await expect(page).toHaveURL("/");

		await page.goto(chatUrl);

		await expect(page.getByText("History recall test")).toBeVisible();
	});
});

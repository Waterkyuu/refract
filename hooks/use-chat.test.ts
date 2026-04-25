import jotaiStore from "@/atoms";
import { workspaceChartAtom, workspaceDatasetAtom } from "@/atoms/chat";
import loginDialogAtom from "@/atoms/login-dialog";
import {
	createAuthAwareChatFetch,
	extractToolEventsFromMessages,
} from "@/hooks/use-chat";
import type { UIMessage } from "ai";

type SimplePart = {
	type: string;
	[key: string]: unknown;
};

const makeToolPart = (
	toolName: string,
	state: string,
	toolCallId: string,
	extra?: Record<string, unknown>,
): SimplePart => ({
	type: `tool-${toolName}`,
	toolCallId,
	state,
	input: {},
	...extra,
});

const makeMessage = (
	role: "user" | "assistant",
	parts: SimplePart[],
): UIMessage =>
	({
		id: `msg-${Math.random()}`,
		role,
		parts,
	}) as UIMessage;

describe("extractToolEventsFromMessages", () => {
	beforeEach(() => {
		jotaiStore.set(workspaceChartAtom, null);
		jotaiStore.set(workspaceDatasetAtom, null);
	});

	it("returns empty for user-only messages", () => {
		const messages = [makeMessage("user", [{ type: "text", text: "hello" }])];
		const result = extractToolEventsFromMessages(messages, new Map());
		expect(result).toEqual([]);
	});

	it("extracts a tool call event from input-streaming state", () => {
		const messages = [
			makeMessage("assistant", [
				makeToolPart("createSandbox", "input-streaming", "call-1"),
			]),
		];
		const events = extractToolEventsFromMessages(messages, new Map());
		expect(events).toHaveLength(1);
		expect(events[0]).toEqual(
			expect.objectContaining({
				toolCallId: "call-1",
				toolName: "createSandbox",
				state: "partial-call",
			}),
		);
	});

	it("extracts tool call event from output-available state", () => {
		const messages = [
			makeMessage("assistant", [
				makeToolPart("createSandbox", "output-available", "call-1", {
					output: {
						sandboxId: "sb-123",
						vncUrl: "https://8080-sb-123.e2b.dev",
						status: "running",
					},
				}),
			]),
		];
		const events = extractToolEventsFromMessages(messages, new Map());
		expect(events).toHaveLength(1);
		expect(events[0].state).toBe("result");
		expect(events[0].result).toEqual({
			sandboxId: "sb-123",
			vncUrl: "https://8080-sb-123.e2b.dev",
			status: "running",
		});
	});

	it("extracts tool call from output-error state", () => {
		const messages = [
			makeMessage("assistant", [
				makeToolPart("executeCode", "output-error", "call-1", {
					errorText: "Code execution timed out",
				}),
			]),
		];
		const events = extractToolEventsFromMessages(messages, new Map());
		expect(events).toHaveLength(1);
		expect(events[0].state).toBe("result");
		expect(events[0].result).toEqual({ error: "Code execution timed out" });
	});

	it("extracts multiple tool calls from different messages", () => {
		const messages = [
			makeMessage("assistant", [
				makeToolPart("createSandbox", "output-available", "call-1", {
					output: {
						sandboxId: "sb-123",
						vncUrl: "https://vnc.example.com",
						status: "running",
					},
				}),
				makeToolPart("navigateBrowser", "input-available", "call-2", {
					input: { url: "https://google.com" },
				}),
			]),
		];
		const events = extractToolEventsFromMessages(messages, new Map());
		expect(events).toHaveLength(2);
		expect(events[0].toolCallId).toBe("call-1");
		expect(events[0].toolName).toBe("createSandbox");
		expect(events[1].toolCallId).toBe("call-2");
		expect(events[1].toolName).toBe("navigateBrowser");
	});

	it("skips non-tool parts (text, reasoning)", () => {
		const messages = [
			makeMessage("assistant", [
				{ type: "text", text: "hello" },
				{ type: "reasoning", text: "thinking..." },
				makeToolPart("searchWeb", "input-available", "call-1"),
			]),
		];
		const events = extractToolEventsFromMessages(messages, new Map());
		expect(events).toHaveLength(1);
		expect(events[0].toolName).toBe("searchWeb");
	});

	it("ignores parts without toolCallId", () => {
		const messages = [makeMessage("assistant", [{ type: "tool-searchWeb" }])];
		const events = extractToolEventsFromMessages(messages, new Map());
		expect(events).toEqual([]);
	});

	it("updates workspace chart download info when chart persistence completes", () => {
		jotaiStore.set(workspaceChartAtom, {
			generatedAt: Date.now(),
			images: [],
			title: "Revenue",
			toolCallId: "chart-call",
		});

		const messages = [
			makeMessage("assistant", [
				makeToolPart("persistLatestChart", "output-available", "call-1", {
					output: {
						downloadUrl: "/api/file/chart-1/download",
						fileId: "chart-1",
						filename: "revenue.png",
						status: "success",
					},
				}),
			]),
		];

		extractToolEventsFromMessages(messages, new Map());

		expect(jotaiStore.get(workspaceChartAtom)).toEqual(
			expect.objectContaining({
				images: [
					{
						downloadUrl: "/api/file/chart-1/download",
						fileId: "chart-1",
						filename: "revenue.png",
					},
				],
				title: "Revenue",
			}),
		);
	});

	it("does not persist dataset preview into workspace state", () => {
		const messages = [
			makeMessage("assistant", [
				makeToolPart("persistCodeFile", "output-available", "dataset-call", {
					output: {
						downloadUrl: "https://r2.example/cleaned.csv",
						fileId: "dataset-1",
						filename: "cleaned.csv",
						kind: "dataset",
						preview: {
							activeSheet: "Sheet1",
							columns: ["a"],
							rows: [["1"]],
							sheetNames: ["Sheet1"],
							totalColumns: 1,
							totalRows: 1,
						},
					},
				}),
			]),
		];

		extractToolEventsFromMessages(messages, new Map());

		const dataset = jotaiStore.get(workspaceDatasetAtom);
		expect(dataset).toEqual(
			expect.objectContaining({
				downloadUrl: "https://r2.example/cleaned.csv",
				fileId: "dataset-1",
				filename: "cleaned.csv",
			}),
		);
		expect(dataset).not.toHaveProperty("preview");
	});
});

describe("createAuthAwareChatFetch", () => {
	beforeEach(() => {
		jotaiStore.set(loginDialogAtom, false);
	});

	it("opens the login dialog when chat requests return 401", async () => {
		const authAwareFetch = createAuthAwareChatFetch(async () => {
			return { status: 401 } as Response;
		});

		await authAwareFetch("/api/chat");

		expect(jotaiStore.get(loginDialogAtom)).toBe(true);
	});

	it("keeps the login dialog closed for non-401 responses", async () => {
		const authAwareFetch = createAuthAwareChatFetch(async () => {
			return { status: 200 } as Response;
		});

		await authAwareFetch("/api/chat");

		expect(jotaiStore.get(loginDialogAtom)).toBe(false);
	});
});

describe("formatRelativeDate", () => {
	const { formatRelativeDate } = require("@/lib/utils");

	it("returns Today for same day", () => {
		const now = new Date();
		expect(formatRelativeDate(now)).toBe("Today");
	});

	it("returns Yesterday for 1 day ago", () => {
		const yesterday = new Date(Date.now() - 86400000);
		expect(formatRelativeDate(yesterday)).toBe("Yesterday");
	});

	it("returns Last week for 3 days ago", () => {
		const threeDays = new Date(Date.now() - 3 * 86400000);
		expect(formatRelativeDate(threeDays)).toBe("Last week");
	});

	it("returns Last month for 15 days ago", () => {
		const fifteenDays = new Date(Date.now() - 15 * 86400000);
		expect(formatRelativeDate(fifteenDays)).toBe("Last month");
	});

	it("returns Older for 60 days ago", () => {
		const sixtyDays = new Date(Date.now() - 60 * 86400000);
		expect(formatRelativeDate(sixtyDays)).toBe("Older");
	});
});

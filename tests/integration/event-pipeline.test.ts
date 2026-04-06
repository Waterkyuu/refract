import {
	clearToolEventsAtom,
	dispatchToolEventAtom,
	toolEventsAtom,
	vncUrlAtom,
} from "@/atoms/chat";
import { extractToolEventsFromMessages } from "@/hooks/use-chat";
import type { ToolCallEvent } from "@/types/chat";
import type { UIMessage } from "ai";
import { getDefaultStore } from "jotai";
import "@testing-library/jest-dom";

const mockToolPart = (
	toolName: string,
	state: string,
	toolCallId: string,
	extra?: Record<string, unknown>,
) =>
	({
		type: `tool-${toolName}`,
		toolCallId,
		state,
		input: {},
		...extra,
	}) as Record<string, unknown>;

const mockMessage = (
	role: "user" | "assistant",
	parts: Record<string, unknown>[],
): UIMessage =>
	({
		id: `msg-${Math.random()}`,
		role,
		parts,
	}) as unknown as UIMessage;

describe("Event Pipeline Integration", () => {
	beforeEach(() => {
		const store = getDefaultStore();
		store.set(toolEventsAtom, []);
		store.set(vncUrlAtom, "");
	});

	afterEach(() => {
		const store = getDefaultStore();
		store.set(toolEventsAtom, []);
		store.set(vncUrlAtom, "");
	});

	it("extracts tool events and dispatches to jotai store", () => {
		const store = getDefaultStore();
		const existingMap = new Map<string, ToolCallEvent>();
		const messages = [
			mockMessage("assistant", [
				mockToolPart("createSandbox", "output-available", "call-1", {
					output: {
						sandboxId: "sb-abc",
						vncUrl: "https://8080-sb-abc.e2b.dev",
						status: "running",
					},
				}),
			]),
		];

		const events = extractToolEventsFromMessages(messages, existingMap);
		for (const event of events) {
			existingMap.set(event.toolCallId, event);
			store.set(dispatchToolEventAtom, event);
		}

		const toolEvents = store.get(toolEventsAtom);
		expect(toolEvents).toHaveLength(1);
		expect(toolEvents[0].toolCallId).toBe("call-1");
		expect(toolEvents[0].toolName).toBe("createSandbox");
	});

	it("sets vncUrl when createSandbox completes", () => {
		const store = getDefaultStore();
		const existingMap = new Map<string, ToolCallEvent>();
		const messages = [
			mockMessage("assistant", [
				mockToolPart("createSandbox", "output-available", "call-2", {
					output: {
						sandboxId: "sb-xyz",
						vncUrl: "https://8080-sb-xyz.e2b.dev",
						status: "running",
					},
				}),
			]),
		];

		extractToolEventsFromMessages(messages, existingMap);
		expect(store.get(vncUrlAtom)).toBe("https://8080-sb-xyz.e2b.dev");
	});

	it("handles multiple tool calls in a single message", () => {
		const store = getDefaultStore();
		const existingMap = new Map<string, ToolCallEvent>();
		const messages = [
			mockMessage("assistant", [
				mockToolPart("navigateBrowser", "input-available", "nav-1"),
				mockToolPart("executeCode", "output-available", "exec-1", {
					output: { stdout: "ok" },
				}),
			]),
		];

		const events = extractToolEventsFromMessages(messages, existingMap);
		for (const event of events) {
			existingMap.set(event.toolCallId, event);
			store.set(dispatchToolEventAtom, event);
		}

		const toolEvents = store.get(toolEventsAtom);
		expect(toolEvents).toHaveLength(2);
		expect(toolEvents.map((e: ToolCallEvent) => e.toolName)).toEqual(
			expect.arrayContaining(["navigateBrowser", "executeCode"]),
		);
	});

	it("updates existing event when same toolCallId reappears", () => {
		const store = getDefaultStore();
		const existingMap = new Map<string, ToolCallEvent>();
		existingMap.set("call-1", {
			id: "evt-existing",
			toolCallId: "call-1",
			toolName: "navigateBrowser",
			args: { url: "https://example.com" },
			state: "call",
			startedAt: 1000,
		});

		const messages = [
			mockMessage("assistant", [
				mockToolPart("navigateBrowser", "output-available", "call-1", {
					output: { status: "success" },
				}),
			]),
		];

		const events = extractToolEventsFromMessages(messages, existingMap);
		for (const event of events) {
			existingMap.set(event.toolCallId, event);
			store.set(dispatchToolEventAtom, event);
		}

		const toolEvents = store.get(toolEventsAtom);
		expect(toolEvents).toHaveLength(1);
		expect(toolEvents[0].state).toBe("result");
		expect(toolEvents[0].result).toEqual({ status: "success" });
	});

	it("clears all events when clearToolEventsAtom is dispatched", () => {
		const store = getDefaultStore();
		store.set(dispatchToolEventAtom, {
			id: "evt-1",
			toolCallId: "call-1",
			toolName: "test",
			args: {},
			state: "call",
			startedAt: 1000,
		});

		expect(store.get(toolEventsAtom)).toHaveLength(1);

		store.set(clearToolEventsAtom);
		expect(store.get(toolEventsAtom)).toEqual([]);
	});
});

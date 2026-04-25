import type { UIMessage } from "ai";
import {
	applyAssistantThinkingStateToMessages,
	deriveAssistantThinkingStateByMessageId,
} from "./reasoning-timing";

const createAssistantMessage = (
	id: string,
	parts: UIMessage["parts"],
): UIMessage => ({
	id,
	role: "assistant",
	parts,
});

describe("assistant thinking state", () => {
	it("keeps per-message thinking times stable when a newer assistant message completes", () => {
		const firstAssistantMessage = createAssistantMessage("assistant-1", [
			{ type: "text", text: "First response" },
		]);
		const secondAssistantMessage = createAssistantMessage("assistant-2", [
			{ type: "text", text: "Second response" },
		]);

		const firstState = deriveAssistantThinkingStateByMessageId(
			{},
			[firstAssistantMessage],
			3,
		);
		const secondState = deriveAssistantThinkingStateByMessageId(
			firstState,
			[firstAssistantMessage, secondAssistantMessage],
			2,
		);

		expect(secondState["assistant-1"]?.messageTime).toBe(3);
		expect(secondState["assistant-2"]?.messageTime).toBe(2);
	});

	it("keeps each reasoning block timing independent inside the same assistant message", () => {
		const initialMessage = createAssistantMessage("assistant-reasoning", [
			{ type: "reasoning", text: "Inspecting the first issue" },
			{ type: "text", text: "First issue handled." },
		]);
		const updatedMessage = createAssistantMessage("assistant-reasoning", [
			{ type: "reasoning", text: "Inspecting the first issue" },
			{ type: "text", text: "First issue handled." },
			{ type: "reasoning", text: "Inspecting the second issue" },
			{ type: "text", text: "Second issue handled." },
		]);

		const firstState = deriveAssistantThinkingStateByMessageId(
			{},
			[initialMessage],
			3,
		);
		const secondState = deriveAssistantThinkingStateByMessageId(
			firstState,
			[updatedMessage],
			2,
		);
		const [resolvedMessage] = applyAssistantThinkingStateToMessages(
			[updatedMessage],
			secondState,
		);

		expect(resolvedMessage?.parts[0]).toEqual(
			expect.objectContaining({
				type: "reasoning",
				durationSeconds: 3,
			}),
		);
		expect(resolvedMessage?.parts[2]).toEqual(
			expect.objectContaining({
				type: "reasoning",
				durationSeconds: 2,
			}),
		);
	});

	it("does not allocate state for assistant messages without recorded timing", () => {
		const assistantMessage = createAssistantMessage("assistant-plain", [
			{ type: "text", text: "No timing yet" },
		]);

		const nextState = deriveAssistantThinkingStateByMessageId(
			{},
			[assistantMessage],
			null,
		);

		expect(nextState["assistant-plain"]).toBeUndefined();
	});
});

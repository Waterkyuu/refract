import type { UIMessage } from "ai";
import { buildMessageRows } from "./chat";

const makeMessage = (
	id: string,
	role: UIMessage["role"],
	text: string,
): UIMessage => ({
	id,
	role,
	parts: [{ type: "text", text }],
});

describe("buildMessageRows", () => {
	it("keeps message order stable within the same save batch", () => {
		const messages = [
			makeMessage("user-1", "user", "first question"),
			makeMessage("assistant-1", "assistant", "first answer"),
			makeMessage("user-2", "user", "follow up"),
		];

		const rows = buildMessageRows(messages, "session-1", 1_710_000_000_000);

		expect(rows.map((row) => row.id)).toEqual([
			"user-1",
			"assistant-1",
			"user-2",
		]);
		expect(rows.map((row) => row.createdAt)).toEqual([
			1_710_000_000_000_000, 1_710_000_000_000_001, 1_710_000_000_000_002,
		]);
	});
});

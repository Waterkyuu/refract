import type { UIMessage } from "ai";
import { buildMessageRows } from "./chat";

const makeTextMessage = (
	id: string,
	role: UIMessage["role"],
	text: string,
): UIMessage => ({
	id,
	role,
	parts: [{ type: "text", text }],
});

describe("chat indexeddb storage", () => {
	it("builds message rows with the owning user id", () => {
		const sessionId = `session-${crypto.randomUUID()}`;
		const userId = `user-${crypto.randomUUID()}`;
		const messages = [
			makeTextMessage(`message-${crypto.randomUUID()}`, "user", "first user"),
		];

		const rows = buildMessageRows(messages, sessionId, userId);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			id: messages[0]?.id,
			userId,
			sessionId,
			role: "user",
		});
	});

	it("keeps batched message ordering stable", () => {
		const sessionId = `session-${crypto.randomUUID()}`;
		const userId = `user-${crypto.randomUUID()}`;
		const batchTimestamp = Date.now();
		const messages = [
			makeTextMessage(`message-${crypto.randomUUID()}`, "user", "first user"),
			makeTextMessage(
				`message-${crypto.randomUUID()}`,
				"assistant",
				"second user",
			),
		];

		const rows = buildMessageRows(messages, sessionId, userId, batchTimestamp);

		expect(rows[0]?.createdAt).toBe(batchTimestamp * 1000);
		expect(rows[1]?.createdAt).toBe(batchTimestamp * 1000 + 1);
	});
});

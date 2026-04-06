import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";
import useAgentChat from "./use-chat";

type ChatHarnessProps = {
	sessionId: string;
	initialMessages: UIMessage[];
};

const makeTextMessage = (
	id: string,
	role: UIMessage["role"],
	text: string,
): UIMessage => ({
	id,
	role,
	parts: [{ type: "text", text }],
});

const ChatHarness = ({ sessionId, initialMessages }: ChatHarnessProps) => {
	const { messages } = useAgentChat({
		sessionId,
		initialMessages,
	});

	const text = messages
		.flatMap((message) =>
			message.parts.flatMap((part) =>
				part.type === "text" ? [part.text] : [],
			),
		)
		.join("|");

	return (
		<div>
			<div data-testid="message-count">{messages.length}</div>
			<div data-testid="message-text">{text}</div>
		</div>
	);
};

describe("useAgentChat history hydration", () => {
	it("hydrates persisted history when it loads after the chat instance mounts", () => {
		const historyMessages = [
			makeTextMessage("assistant-1", "assistant", "loaded from history"),
		];

		const { rerender } = render(
			<ChatHarness sessionId="session-1" initialMessages={[]} />,
		);

		expect(screen.getByTestId("message-count")).toHaveTextContent("0");

		rerender(
			<ChatHarness sessionId="session-1" initialMessages={historyMessages} />,
		);

		expect(screen.getByTestId("message-count")).toHaveTextContent("1");
		expect(screen.getByTestId("message-text")).toHaveTextContent(
			"loaded from history",
		);
	});

	it("shows the next session history after switching chats", () => {
		const firstSessionMessages = [
			makeTextMessage("assistant-1", "assistant", "first session history"),
		];
		const secondSessionMessages = [
			makeTextMessage("assistant-2", "assistant", "second session history"),
		];

		const { rerender } = render(
			<ChatHarness
				sessionId="session-1"
				initialMessages={firstSessionMessages}
			/>,
		);

		expect(screen.getByTestId("message-text")).toHaveTextContent(
			"first session history",
		);

		rerender(<ChatHarness sessionId="session-2" initialMessages={[]} />);

		expect(screen.getByTestId("message-count")).toHaveTextContent("0");

		rerender(
			<ChatHarness
				sessionId="session-2"
				initialMessages={secondSessionMessages}
			/>,
		);

		expect(screen.getByTestId("message-count")).toHaveTextContent("1");
		expect(screen.getByTestId("message-text")).toHaveTextContent(
			"second session history",
		);
	});
});

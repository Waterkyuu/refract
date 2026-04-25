import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";
import MessageArea from "./message-area";

jest.mock("./message-item", () => ({
	__esModule: true,
	default: ({
		message,
		thinkingTime,
	}: {
		message: UIMessage;
		thinkingTime: number | null;
	}) => (
		<div>
			<span>{message.parts.find((part) => part.type === "text")?.text}</span>
			<span data-testid={`thinking-${message.id}`}>
				{thinkingTime == null ? "none" : thinkingTime.toFixed(1)}
			</span>
		</div>
	),
}));

const makeTextMessage = (
	id: string,
	role: UIMessage["role"],
	text: string,
): UIMessage => ({
	id,
	role,
	parts: [{ type: "text", text }],
});

describe("MessageArea history loading", () => {
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, "scrollTo", {
			value: jest.fn(),
			writable: true,
		});
	});

	it("shows a skeleton while history is loading and removes it after messages render", () => {
		const historyMessages = [
			makeTextMessage("assistant-1", "assistant", "Loaded history message"),
		];

		const { rerender } = render(
			<MessageArea
				messages={[]}
				thinkingTime={null}
				isHistoryLoading
				className="min-h-0 flex-1"
			/>,
		);

		expect(screen.getByTestId("chat-history-skeleton")).toBeInTheDocument();
		expect(
			screen.queryByText("Loaded history message"),
		).not.toBeInTheDocument();

		rerender(
			<MessageArea
				messages={historyMessages}
				thinkingTime={null}
				isHistoryLoading={false}
				className="min-h-0 flex-1"
			/>,
		);

		expect(
			screen.queryByTestId("chat-history-skeleton"),
		).not.toBeInTheDocument();
		expect(screen.getByText("Loaded history message")).toBeInTheDocument();
	});

	it("shows a jump-to-latest button when the user scrolls away from bottom", () => {
		const historyMessages = [
			makeTextMessage("assistant-1", "assistant", "Loaded history message"),
		];

		render(
			<MessageArea
				messages={historyMessages}
				thinkingTime={null}
				className="min-h-0 flex-1"
			/>,
		);

		const scrollContainer = screen.getByTestId("message-area-scroll-container");

		Object.defineProperty(scrollContainer, "scrollHeight", {
			value: 1000,
			configurable: true,
		});
		Object.defineProperty(scrollContainer, "clientHeight", {
			value: 400,
			configurable: true,
		});
		Object.defineProperty(scrollContainer, "scrollTop", {
			value: 200,
			configurable: true,
		});

		fireEvent.scroll(scrollContainer);

		expect(
			screen.getByRole("button", { name: "Jump to latest" }),
		).toBeVisible();
	});
});

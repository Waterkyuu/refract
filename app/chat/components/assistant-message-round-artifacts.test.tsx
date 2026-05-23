import "@testing-library/jest-dom";
import type { WorkspaceRoundArtifact } from "@/lib/chat/workspace-hydration";
import { fireEvent, render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import MessageItem from "./message-item";

jest.mock("react-markdown", () => ({
	__esModule: true,
	default: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const assistantMessageWithRoundArtifacts = {
	id: "assistant-round-artifacts",
	role: "assistant",
	parts: [
		{
			type: "text",
			text: "Round completed",
		},
		{
			type: "artifact",
			category: "data",
			fileId: "dataset-1",
			filename: "cleaned.csv",
			extension: "csv",
			fileSize: 312,
			kind: "dataset",
			preview: {
				sheetNames: ["Sheet1"],
				activeSheet: "Sheet1",
				columns: ["value"],
				rows: [["1"]],
				totalRows: 1,
				totalColumns: 1,
			},
		},
		{
			type: "artifact",
			category: "chart",
			fileId: "chart-1",
			filename: "trend.png",
			extension: "png",
			downloadUrl: "/api/file/chart-1/download",
		},
		{
			type: "artifact",
			category: "report",
			fileId: "report-1",
			filename: "analysis.md",
			extension: "md",
			downloadUrl: "/api/file/report-1/download",
		},
	],
} as unknown as UIMessage;

const assistantMessageWithMultipleCharts = {
	id: "assistant-round-multi-chart",
	role: "assistant",
	parts: [
		{
			type: "text",
			text: "Generated two chart versions",
		},
		{
			type: "artifact",
			category: "chart",
			fileId: "chart-a",
			filename: "first.png",
			extension: "png",
		},
		{
			type: "artifact",
			category: "chart",
			fileId: "chart-b",
			filename: "second.png",
			extension: "png",
		},
	],
} as unknown as UIMessage;

const assistantMessageWithInlineReport = {
	id: "assistant-round-inline-report",
	role: "assistant",
	parts: [
		{
			type: "text",
			text: "Report completed",
		},
		{
			type: "markdown-content",
			content: "# Analysis Report\n\nRevenue increased by 12%.",
		},
	],
} as unknown as UIMessage;

describe("AssistantMessage round artifact actions", () => {
	it("renders per-category buttons with icon prefix and opens the selected artifact", () => {
		const onSelectRoundArtifact = jest.fn();

		render(
			<MessageItem
				message={assistantMessageWithRoundArtifacts}
				thinkingTime={null}
				hasToolCalls={false}
				onSelectRoundArtifact={onSelectRoundArtifact}
			/>,
		);

		const dataButton = screen.getByRole("button", { name: /Data/i });
		const chartButton = screen.getByRole("button", { name: /Chart/i });
		const reportButton = screen.getByRole("button", { name: /Report/i });

		expect(dataButton.querySelector("svg")).toBeInTheDocument();
		expect(chartButton.querySelector("svg")).toBeInTheDocument();
		expect(reportButton.querySelector("svg")).toBeInTheDocument();

		fireEvent.click(dataButton);

		expect(onSelectRoundArtifact).toHaveBeenCalledTimes(1);
		expect(onSelectRoundArtifact).toHaveBeenCalledWith(
			expect.objectContaining<Partial<WorkspaceRoundArtifact>>({
				category: "data",
				fileId: "dataset-1",
				filename: "cleaned.csv",
			}),
		);
	});

	it("shows version list for categories with multiple artifacts", () => {
		const onSelectRoundArtifact = jest.fn();

		render(
			<MessageItem
				message={assistantMessageWithMultipleCharts}
				thinkingTime={null}
				hasToolCalls={false}
				onSelectRoundArtifact={onSelectRoundArtifact}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Chart/i }));

		fireEvent.click(screen.getByRole("button", { name: /first\.png\s*v1/i }));

		expect(onSelectRoundArtifact).toHaveBeenCalledWith(
			expect.objectContaining<Partial<WorkspaceRoundArtifact>>({
				category: "chart",
				fileId: "chart-a",
			}),
		);
	});

	it("shows normalized artifact file details for assistant file cards", () => {
		render(
			<MessageItem
				message={assistantMessageWithRoundArtifacts}
				thinkingTime={null}
				hasToolCalls={false}
			/>,
		);

		expect(screen.getByText("CSV 312 Bytes")).toBeInTheDocument();
	});

	it("renders inline markdown report as a round artifact action", () => {
		const onSelectRoundArtifact = jest.fn();

		render(
			<MessageItem
				message={assistantMessageWithInlineReport}
				thinkingTime={null}
				hasToolCalls={false}
				onSelectRoundArtifact={onSelectRoundArtifact}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Report/i }));

		expect(onSelectRoundArtifact).toHaveBeenCalledWith(
			expect.objectContaining<Partial<WorkspaceRoundArtifact>>({
				category: "report",
				label: "Analysis Report",
				markdownContent: "# Analysis Report\n\nRevenue increased by 12%.",
			}),
		);
	});
});

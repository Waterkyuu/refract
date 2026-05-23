import jotaiStore from "@/atoms";
import {
	pendingHomePromptAtom,
	pendingHomeUploadsAtom,
	showChartWorkspaceAtom,
	showFileWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
	workspaceMarkdownContentAtom,
	workspaceViewAtom,
} from "@/atoms/chat";
import { act, render, waitFor } from "@testing-library/react";
import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import ChatPage from "./page";

const mockUseChatHistory = jest.fn();
const mockCreateSession = jest.fn();
const mockSaveMessages = jest.fn();
const mockSetInput = jest.fn();
const mockAppend = jest.fn(async () => {});
const mockStop = jest.fn();
const mockPipelineState: {
	messages: UIMessage[];
} = {
	messages: [],
};

jest.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

jest.mock("@/hooks/use-pipeline-chat", () => ({
	__esModule: true,
	default: () => ({
		messages: mockPipelineState.messages,
		input: "",
		setInput: mockSetInput,
		append: mockAppend,
		isLoading: false,
		stop: mockStop,
		thinkingTime: null,
		assistantThinkingTimeByMessageId: {},
	}),
}));

jest.mock("@/services/chat", () => ({
	useChatHistory: (sessionId: string) => mockUseChatHistory(sessionId),
	useCreateSession: () => ({ mutateAsync: mockCreateSession }),
	useSaveMessages: () => ({ mutate: mockSaveMessages }),
}));

jest.mock("@/components/share/header", () => ({
	__esModule: true,
	default: () => <div data-testid="header" />,
}));

jest.mock("../components/message-area", () => ({
	__esModule: true,
	default: () => <div data-testid="message-area" />,
}));

jest.mock("../components/step-panel", () => ({
	__esModule: true,
	default: () => <div data-testid="step-panel" />,
}));

jest.mock("../components/workspace-panel", () => ({
	__esModule: true,
	default: () => <div data-testid="workspace-panel" />,
}));

jest.mock("@/components/share/input-field", () => ({
	__esModule: true,
	default: () => <div data-testid="input-field" />,
}));

jest.mock("@/components/ui/resizable", () => ({
	ResizablePanelGroup: ({ children }: { children: ReactNode }) => (
		<div data-testid="resizable-group">{children}</div>
	),
	ResizablePanel: ({ children }: { children: ReactNode }) => (
		<div data-testid="resizable-panel">{children}</div>
	),
	ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

jest.mock("@/components/ui/sheet", () => ({
	Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SheetContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("ChatPage workspace reset", () => {
	beforeEach(() => {
		mockUseChatHistory.mockReturnValue({ data: [], isLoading: false });
		mockCreateSession.mockResolvedValue(undefined);
		mockSaveMessages.mockReset();
		mockSetInput.mockReset();
		mockAppend.mockClear();
		mockStop.mockClear();
		mockPipelineState.messages = [];

		jotaiStore.set(vncUrlAtom, "https://old-vnc.example");
		jotaiStore.set(workspaceViewAtom, "chart");
		jotaiStore.set(workspaceChartAtom, {
			generatedAt: 1,
			images: [],
			title: "old-chart",
			toolCallId: "old-tool",
		});
		jotaiStore.set(workspaceDatasetAtom, {
			fileId: "old-dataset",
			filename: "old.csv",
		});
		jotaiStore.set(workspaceFileAtom, {
			extension: "CSV",
			fileId: "old-file",
			filename: "old.csv",
		});
		jotaiStore.set(workspaceMarkdownContentAtom, "old markdown");
		jotaiStore.set(pendingHomePromptAtom, "");
		jotaiStore.set(pendingHomeUploadsAtom, []);
	});

	it("clears stale workspace state when entering a new chat session", async () => {
		render(<ChatPage params={Promise.resolve({ id: "session-new" })} />);

		await waitFor(() => {
			expect(mockUseChatHistory).toHaveBeenCalledWith("session-new");
		});

		await waitFor(() => {
			expect(jotaiStore.get(vncUrlAtom)).toBe("");
			expect(jotaiStore.get(workspaceViewAtom)).toBe("empty");
			expect(jotaiStore.get(workspaceChartAtom)).toBeNull();
			expect(jotaiStore.get(workspaceDatasetAtom)).toBeNull();
			expect(jotaiStore.get(workspaceFileAtom)).toBeNull();
			expect(jotaiStore.get(workspaceMarkdownContentAtom)).toBe("");
		});
	});

	it("preserves the user-selected workspace tab while streaming updates continue", async () => {
		const initialStreamingMessages = [
			{
				id: "assistant-stream-1",
				role: "assistant" as const,
				parts: [
					{ type: "text", text: "Working on the analysis" },
					{
						type: "artifact",
						category: "data",
						fileId: "dataset-1",
						filename: "cleaned.csv",
						extension: "csv",
						kind: "dataset",
						downloadUrl: "https://public.example/cleaned.csv",
					},
					{
						type: "artifact",
						category: "chart",
						fileId: "chart-1",
						filename: "trend.png",
						extension: "png",
						downloadUrl: "https://public.example/trend.png",
					},
				],
			},
		] as unknown as UIMessage[];

		mockPipelineState.messages = initialStreamingMessages;

		const { rerender } = render(
			<ChatPage params={Promise.resolve({ id: "session-stream" })} />,
		);

		await waitFor(() => {
			expect(jotaiStore.get(workspaceDatasetAtom)?.fileId).toBe("dataset-1");
			expect(jotaiStore.get(workspaceChartAtom)?.images[0]?.fileId).toBe(
				"chart-1",
			);
			expect(jotaiStore.get(workspaceViewAtom)).toBe("chart");
		});

		act(() => {
			jotaiStore.set(workspaceViewAtom, "dataset");
		});
		expect(jotaiStore.get(workspaceViewAtom)).toBe("dataset");

		act(() => {
			mockPipelineState.messages = [
				{
					...initialStreamingMessages[0],
					id: "assistant-stream-2",
					parts: [
						{ type: "text", text: "Still streaming more details" },
						{
							type: "artifact",
							category: "data",
							fileId: "dataset-1",
							filename: "cleaned.csv",
							extension: "csv",
							kind: "dataset",
							downloadUrl: "https://public.example/cleaned.csv",
						},
						{
							type: "artifact",
							category: "chart",
							fileId: "chart-2",
							filename: "trend-v2.png",
							extension: "png",
							downloadUrl: "https://public.example/trend-v2.png",
						},
					],
				},
			] as unknown as UIMessage[];

			rerender(<ChatPage params={Promise.resolve({ id: "session-stream" })} />);
		});

		await waitFor(() => {
			expect(jotaiStore.get(workspaceChartAtom)?.images[0]?.fileId).toBe(
				"chart-2",
			);
		});

		expect(jotaiStore.get(workspaceViewAtom)).toBe("dataset");
	});

	it("shows the clicked chart image, not the latest one from snapshot derivation", async () => {
		const messagesWithCharts = [
			{
				id: "assistant-charts",
				role: "assistant" as const,
				parts: [
					{ type: "text", text: "Here are three charts" },
					{
						type: "artifact",
						category: "chart",
						fileId: "chart-1",
						filename: "chart_1.png",
						extension: "png",
						downloadUrl: "https://example.com/chart_1.png",
					},
					{
						type: "artifact",
						category: "chart",
						fileId: "chart-2",
						filename: "chart_2.png",
						extension: "png",
						downloadUrl: "https://example.com/chart_2.png",
					},
					{
						type: "artifact",
						category: "chart",
						fileId: "chart-3",
						filename: "chart_3.png",
						extension: "png",
						downloadUrl: "https://example.com/chart_3.png",
					},
				],
			},
		] as unknown as UIMessage[];

		mockPipelineState.messages = messagesWithCharts;

		render(<ChatPage params={Promise.resolve({ id: "session-charts" })} />);

		await waitFor(() => {
			expect(jotaiStore.get(workspaceChartAtom)?.images[0]?.fileId).toBe(
				"chart-3",
			);
			expect(jotaiStore.get(workspaceViewAtom)).toBe("chart");
		});

		act(() => {
			jotaiStore.set(showChartWorkspaceAtom, {
				generatedAt: Date.now(),
				images: [
					{
						downloadUrl: "https://example.com/chart_1.png",
						fileId: "chart-1",
						filename: "chart_1.png",
					},
				],
				title: "chart_1.png",
				toolCallId: "chart-1",
			});
		});

		expect(jotaiStore.get(workspaceChartAtom)?.images[0]?.fileId).toBe(
			"chart-1",
		);
		expect(jotaiStore.get(workspaceViewAtom)).toBe("chart");
	});

	it("preserves user chart selection when switching views", async () => {
		const messagesWithCharts = [
			{
				id: "assistant-charts",
				role: "assistant" as const,
				parts: [
					{ type: "text", text: "Charts" },
					{
						type: "artifact",
						category: "chart",
						fileId: "chart-1",
						filename: "chart_1.png",
						extension: "png",
						downloadUrl: "https://example.com/chart_1.png",
					},
					{
						type: "artifact",
						category: "chart",
						fileId: "chart-3",
						filename: "chart_3.png",
						extension: "png",
						downloadUrl: "https://example.com/chart_3.png",
					},
				],
			},
		] as unknown as UIMessage[];

		mockPipelineState.messages = messagesWithCharts;

		render(<ChatPage params={Promise.resolve({ id: "session-charts" })} />);

		await waitFor(() => {
			expect(jotaiStore.get(workspaceChartAtom)?.images[0]?.fileId).toBe(
				"chart-3",
			);
			expect(jotaiStore.get(workspaceViewAtom)).toBe("chart");
		});

		act(() => {
			jotaiStore.set(showFileWorkspaceAtom, {
				downloadUrl: "/api/file/doc/download",
				extension: "pdf",
				fileId: "doc-1",
				filename: "report.pdf",
			});
		});

		act(() => {
			jotaiStore.set(showChartWorkspaceAtom, {
				generatedAt: Date.now(),
				images: [
					{
						downloadUrl: "https://example.com/chart_1.png",
						fileId: "chart-1",
						filename: "chart_1.png",
					},
				],
				title: "chart_1.png",
				toolCallId: "chart-1",
			});
		});

		await waitFor(() => {
			expect(jotaiStore.get(workspaceViewAtom)).toBe("chart");
			expect(jotaiStore.get(workspaceChartAtom)?.images[0]?.fileId).toBe(
				"chart-1",
			);
		});
	});
});

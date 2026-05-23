import type { DatasetPreview } from "@/types";
import type { UIMessage } from "ai";
import {
	deriveRoundArtifactsByMessage,
	deriveRoundArtifactsFromMessage,
	deriveWorkspaceSnapshotFromMessages,
} from "./workspace-hydration";

const datasetPreview: DatasetPreview = {
	sheetNames: ["Sheet1"],
	activeSheet: "Sheet1",
	columns: ["value"],
	rows: [["1"]],
	totalRows: 1,
	totalColumns: 1,
};

const assistantRoundMessage: UIMessage = {
	id: "assistant-round",
	role: "assistant",
	parts: [
		{
			type: "tool-createSandbox",
			toolCallId: "sandbox-call",
			state: "output-available",
			input: {},
			output: { vncUrl: "https://sandbox.example/vnc" },
		},
		{
			type: "tool-codeInterpreter",
			toolCallId: "chart-tool-call",
			state: "output-available",
			input: {},
			output: {
				results: [
					{
						chart: { title: "Revenue trend" },
						png: "base64-png",
					},
				],
			},
		},
		{
			type: "tool-persistAllCharts",
			toolCallId: "chart-file-call",
			state: "output-available",
			input: {},
			output: {
				status: "success",
				chartCount: 1,
				artifacts: [
					{
						fileId: "chart-1",
						filename: "revenue.png",
						downloadUrl: "/api/file/chart-1/download",
						contentType: "image/png",
						fileSize: 2048,
					},
				],
			},
		},
		{
			type: "tool-persistCodeFile",
			toolCallId: "dataset-call",
			state: "output-available",
			input: {},
			output: {
				kind: "dataset",
				fileId: "dataset-1",
				filename: "cleaned.csv",
				preview: datasetPreview,
			},
		},
		{
			type: "tool-persistCodeFile",
			toolCallId: "report-call",
			state: "output-available",
			input: {},
			output: {
				kind: "document",
				fileId: "report-1",
				filename: "analysis.md",
			},
		},
	],
};

describe("workspace hydration", () => {
	it("derives per-round artifacts grouped by data/chart/report", () => {
		const artifacts = deriveRoundArtifactsFromMessage(assistantRoundMessage);

		expect(artifacts.data).toHaveLength(1);
		expect(artifacts.chart).toHaveLength(1);
		expect(artifacts.report).toHaveLength(1);
		expect(artifacts.data[0]).toEqual(
			expect.objectContaining({
				category: "data",
				fileId: "dataset-1",
				filename: "cleaned.csv",
			}),
		);
		expect(artifacts.chart[0]).toEqual(
			expect.objectContaining({
				category: "chart",
				fileId: "chart-1",
				filename: "revenue.png",
				downloadUrl: "/api/file/chart-1/download",
			}),
		);
		expect(artifacts.report[0]).toEqual(
			expect.objectContaining({
				category: "report",
				fileId: "report-1",
				filename: "analysis.md",
			}),
		);
	});

	it("hydrates snapshot from messages and keeps the latest updated view", () => {
		const userMessage: UIMessage = {
			id: "user-1",
			role: "user",
			parts: [{ type: "text", text: "Analyze these files" }],
			metadata: {
				attachments: [
					{
						fileId: "upload-dataset",
						filename: "upload.csv",
						extension: "CSV",
					},
				],
			},
		};

		const snapshot = deriveWorkspaceSnapshotFromMessages([
			userMessage,
			assistantRoundMessage,
		]);

		expect(snapshot.vncUrl).toBe("https://sandbox.example/vnc");
		expect(snapshot.dataset).toEqual(
			expect.objectContaining({
				fileId: "dataset-1",
				filename: "cleaned.csv",
			}),
		);
		expect(snapshot.dataset).not.toHaveProperty("preview");
		expect(snapshot.chart).toEqual(
			expect.objectContaining({
				images: [
					expect.objectContaining({
						fileId: "chart-1",
						filename: "revenue.png",
						downloadUrl: "/api/file/chart-1/download",
					}),
				],
				toolCallId: "chart-tool-call",
			}),
		);
		expect(snapshot.file).toEqual(
			expect.objectContaining({
				fileId: "report-1",
				filename: "analysis.md",
			}),
		);
		expect(snapshot.view).toBe("file");
	});

	it("builds artifact map by assistant message id", () => {
		const byMessage = deriveRoundArtifactsByMessage([
			{
				id: "assistant-empty",
				role: "assistant",
				parts: [{ type: "text", text: "No artifacts" }],
			},
			assistantRoundMessage,
		]);

		expect(Object.keys(byMessage)).toEqual(["assistant-round"]);
		expect(byMessage["assistant-round"]?.chart).toHaveLength(1);
	});

	it("hydrates dataset view from dataset attachment metadata without preview", () => {
		const userMessage: UIMessage = {
			id: "user-dataset-no-preview",
			role: "user",
			parts: [{ type: "text", text: "use uploaded dataset" }],
			metadata: {
				attachments: [
					{
						fileId: "upload-dataset-no-preview",
						filename: "upload.csv",
						extension: "CSV",
					},
				],
			},
		};

		const snapshot = deriveWorkspaceSnapshotFromMessages([userMessage]);

		expect(snapshot.dataset).toEqual(
			expect.objectContaining({
				fileId: "upload-dataset-no-preview",
				filename: "upload.csv",
			}),
		);
		expect(snapshot.view).toBe("dataset");
	});

	it("enriches phantom codeInterpreter chart artifacts with file artifact info", () => {
		const message: UIMessage = {
			id: "assistant-phantom-chart",
			role: "assistant",
			parts: [
				{
					type: "tool-codeInterpreter",
					toolCallId: "code-call-1",
					state: "output-available",
					input: {},
					output: {
						results: [{ chart: { title: "Sales Amount Trend in 2024" } }],
					},
				},
				{
					type: "tool-codeInterpreter",
					toolCallId: "code-call-2",
					state: "output-error",
					input: {},
					errorText: "SyntaxError",
				},
				{
					type: "tool-codeInterpreter",
					toolCallId: "code-call-3",
					state: "output-available",
					input: {},
					output: {
						results: [
							{
								chart: {
									title: "2024 Sales Performance: Monthly Metrics Overview",
								},
							},
						],
					},
				},
				{
					type: "artifact",
					category: "chart",
					fileId: "chart-file-1",
					filename: "chart_1.png",
					extension: "png",
					downloadUrl: "/api/file/chart-file-1/download",
				} as unknown as UIMessage["parts"][number],
				{
					type: "artifact",
					category: "chart",
					fileId: "chart-file-2",
					filename: "chart_2.png",
					extension: "png",
					downloadUrl: "/api/file/chart-file-2/download",
				} as unknown as UIMessage["parts"][number],
				{
					type: "artifact",
					category: "chart",
					fileId: "chart-file-3",
					filename: "chart_3.png",
					extension: "png",
					downloadUrl: "/api/file/chart-file-3/download",
				} as unknown as UIMessage["parts"][number],
			],
		};

		const artifacts = deriveRoundArtifactsFromMessage(message);

		expect(artifacts.chart).toHaveLength(3);
		expect(artifacts.chart[0]).toEqual(
			expect.objectContaining({
				title: "Sales Amount Trend in 2024",
				fileId: "chart-file-1",
				filename: "chart_1.png",
				downloadUrl: "/api/file/chart-file-1/download",
			}),
		);
		expect(artifacts.chart[1]).toEqual(
			expect.objectContaining({
				title: "2024 Sales Performance: Monthly Metrics Overview",
				fileId: "chart-file-2",
				filename: "chart_2.png",
				downloadUrl: "/api/file/chart-file-2/download",
			}),
		);
		expect(artifacts.chart[2]).toEqual(
			expect.objectContaining({
				fileId: "chart-file-3",
				filename: "chart_3.png",
				downloadUrl: "/api/file/chart-file-3/download",
			}),
		);
	});

	it("hydrates data artifacts without preview into dataset workspace", () => {
		const assistantMessage: UIMessage = {
			id: "assistant-data-artifact-no-preview",
			role: "assistant",
			parts: [
				{
					type: "artifact",
					category: "data",
					fileId: "dataset-without-preview",
					filename: "cleaned_data.csv",
					extension: "csv",
					kind: "dataset",
					downloadUrl: "https://public.example/cleaned_data.csv",
				} as unknown as UIMessage["parts"][number],
			],
		};

		const snapshot = deriveWorkspaceSnapshotFromMessages([assistantMessage]);

		expect(snapshot.dataset).toEqual(
			expect.objectContaining({
				fileId: "dataset-without-preview",
				filename: "cleaned_data.csv",
			}),
		);
		expect(snapshot.view).toBe("dataset");
	});

	it("derives report artifacts from inline markdown content", () => {
		const assistantMessage: UIMessage = {
			id: "assistant-inline-report",
			role: "assistant",
			parts: [
				{
					type: "markdown-content",
					content: "# Analysis Report\n\nRevenue increased by 12%.",
				} as unknown as UIMessage["parts"][number],
			],
		};

		const artifacts = deriveRoundArtifactsFromMessage(assistantMessage);

		expect(artifacts.report).toHaveLength(1);
		expect(artifacts.report[0]).toEqual(
			expect.objectContaining({
				category: "report",
				label: "Analysis Report",
				markdownContent: "# Analysis Report\n\nRevenue increased by 12%.",
			}),
		);
	});
});

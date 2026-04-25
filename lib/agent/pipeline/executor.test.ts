import type { SandboxSession } from "@/lib/agent/sandbox/e2b";
import type { FileRecord } from "@/types";
import {
	type StepExecutionResult,
	ensurePersistedChartArtifacts,
} from "./executor";

const makeChartRecord = (id: string, name: string): FileRecord => ({
	id,
	filename: name,
	contentType: "image/png",
	fileSize: 2048,
	status: "ready",
	kind: "document",
	objectKey: `${id}/${name}`,
	errorMessage: null,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
});

describe("ensurePersistedChartArtifacts", () => {
	it("auto-persists ALL collected charts when chart code ran but no chart artifact was persisted", async () => {
		const record1 = makeChartRecord("chart-1", "chart_1.png");
		const record2 = makeChartRecord("chart-2", "chart_2.png");
		const sandboxSession = {
			persistAllCharts: jest.fn(async () => [record1, record2]),
		} as unknown as SandboxSession;

		const stepResult: StepExecutionResult = {
			text: '{"chartCount":2,"descriptions":["Chart 1","Chart 2"]}',
			toolErrors: [],
			toolResults: [
				{
					toolName: "codeInterpreter",
					output: {
						results: [
							{ chart: { title: "Revenue trend" }, png: "base64-chart-1" },
						],
					},
				},
				{
					toolName: "codeInterpreter",
					output: {
						results: [
							{ chart: { title: "Sales by region" }, png: "base64-chart-2" },
						],
					},
				},
			],
		};

		const result = await ensurePersistedChartArtifacts(
			stepResult,
			sandboxSession,
		);

		expect(sandboxSession.persistAllCharts).toHaveBeenCalledTimes(1);
		expect(result.toolResults).toContainEqual({
			toolName: "persistAllCharts",
			output: {
				status: "success",
				chartCount: 2,
				artifacts: [
					{
						contentType: "image/png",
						downloadUrl: "/api/file/chart-1/download",
						fileId: "chart-1",
						fileSize: 2048,
						filename: "chart_1.png",
					},
					{
						contentType: "image/png",
						downloadUrl: "/api/file/chart-2/download",
						fileId: "chart-2",
						fileSize: 2048,
						filename: "chart_2.png",
					},
				],
			},
		});
	});

	it("skips auto-persist when persistAllCharts was already called by the agent", async () => {
		const sandboxSession = {
			persistAllCharts: jest.fn(async () => []),
		} as unknown as SandboxSession;

		const stepResult: StepExecutionResult = {
			text: '{"chartCount":1,"descriptions":["Chart 1"]}',
			toolErrors: [],
			toolResults: [
				{
					toolName: "codeInterpreter",
					output: {
						results: [{ chart: { title: "Chart" }, png: "base64" }],
					},
				},
				{
					toolName: "persistAllCharts",
					output: {
						status: "success",
						chartCount: 1,
						artifacts: [
							{
								fileId: "chart-1",
								filename: "chart_1.png",
								downloadUrl: "/api/file/chart-1/download",
							},
						],
					},
				},
			],
		};

		const result = await ensurePersistedChartArtifacts(
			stepResult,
			sandboxSession,
		);

		expect(sandboxSession.persistAllCharts).not.toHaveBeenCalled();
		expect(result.toolResults).toHaveLength(2);
	});
});

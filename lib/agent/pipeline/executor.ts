import { createChartAgent } from "@/lib/agent/agents/chart-agent";
import { createDataAgent } from "@/lib/agent/agents/data-agent";
import { runOrchestrator } from "@/lib/agent/agents/orchestrator";
import { createReportAgent } from "@/lib/agent/agents/report-agent";
import type {
	ChartOutput,
	DataOutput,
	PipelineContext,
	PipelineStep,
	PipelineStreamEvent,
	ReportOutput,
} from "@/lib/agent/agents/types";
import {
	buildStepPrompt,
	createInitialContext,
} from "@/lib/agent/pipeline/context";
import type { FileRecord } from "@/types";
import { stepCountIs, streamText } from "ai";
import { zhipu } from "zhipu-ai-provider";

type ExecutorCallbacks = {
	onEvent: (event: PipelineStreamEvent) => void;
};

const MAIN_MODEL = process.env.GLM_MODEL ?? "glm-4.7";

const extractDataOutput = (text: string): DataOutput | undefined => {
	const jsonMatch = text.match(/\{[\s\S]*"filePath"[\s\S]*"rowCount"[\s\S]*\}/);
	if (!jsonMatch) return undefined;

	try {
		const parsed = JSON.parse(jsonMatch[0]) as DataOutput;
		if (parsed.filePath && typeof parsed.rowCount === "number") {
			return parsed;
		}
	} catch {
		// fallback
	}

	return undefined;
};

const extractChartOutput = (text: string): ChartOutput | undefined => {
	const jsonMatch = text.match(
		/\{[\s\S]*"chartCount"[\s\S]*"descriptions"[\s\S]*\}/,
	);
	if (!jsonMatch) return undefined;

	try {
		const parsed = JSON.parse(jsonMatch[0]) as ChartOutput;
		if (
			typeof parsed.chartCount === "number" &&
			Array.isArray(parsed.descriptions)
		) {
			return parsed;
		}
	} catch {
		// fallback
	}

	return undefined;
};

const extractReportOutput = (text: string): ReportOutput | undefined => {
	const hasTypst =
		text.includes("#import") || text.includes("#set") || text.includes("#show");
	const hasMarkdown = text.includes("## ") || text.includes("# ");

	if (!hasTypst && !hasMarkdown) return undefined;

	return {
		filePath: "/home/user/output/report",
		format: hasTypst ? "typst" : "markdown",
	};
};

const executeStep = async (
	agentSystemPrompt: string,
	// biome-ignore lint/suspicious/noExplicitAny: ToolSet is not exported from ai
	agentTools: Record<string, any>,
	agentMaxSteps: number,
	stepPrompt: string,
	onDelta: (content: string) => void,
): Promise<string> => {
	const result = await streamText({
		model: zhipu(MAIN_MODEL),
		system: agentSystemPrompt,
		messages: [{ role: "user", content: stepPrompt }],
		tools: agentTools,
		stopWhen: stepCountIs(agentMaxSteps),
	});

	let fullText = "";
	for await (const chunk of result.textStream) {
		fullText += chunk;
		onDelta(chunk);
	}

	return fullText;
};

const executePipeline = async (
	userRequest: string,
	attachedFiles: FileRecord[],
	fileIds: string[],
	callbacks: ExecutorCallbacks,
): Promise<PipelineContext> => {
	const { onEvent } = callbacks;

	const pipelinePlan = await runOrchestrator(userRequest, attachedFiles);
	onEvent({ type: "plan", plan: pipelinePlan });

	if (pipelinePlan.steps.length === 0) {
		onEvent({ type: "pipeline-complete" });
		return createInitialContext(userRequest, attachedFiles, pipelinePlan);
	}

	const dataAgent = createDataAgent({ fileIds });
	const chartAgent = createChartAgent({ fileIds });
	const reportAgent = createReportAgent();
	const agentMap: Record<PipelineStep, typeof dataAgent> = {
		data: dataAgent,
		chart: chartAgent,
		report: reportAgent,
	};

	const ctx = createInitialContext(userRequest, attachedFiles, pipelinePlan);

	for (const step of pipelinePlan.steps) {
		const agent = agentMap[step];
		onEvent({ type: "step-start", step });

		try {
			const stepPrompt = buildStepPrompt(step, ctx);
			const fullText = await executeStep(
				agent.systemPrompt,
				agent.tools,
				agent.maxSteps,
				stepPrompt,
				(content: string) => onEvent({ type: "step-delta", step, content }),
			);

			switch (step) {
				case "data":
					ctx.dataOutput = extractDataOutput(fullText) ?? {
						filePath: "/home/user/output/cleaned_data.csv",
						summary: "Data processing completed",
						stats: "See output above",
						rowCount: 0,
						columns: [],
					};
					break;
				case "chart":
					ctx.chartOutput = extractChartOutput(fullText) ?? {
						chartCount: 0,
						descriptions: [],
					};
					break;
				case "report":
					ctx.reportOutput = extractReportOutput(fullText) ?? {
						filePath: "/home/user/output/report",
						format: "markdown",
					};
					break;
			}

			onEvent({ type: "step-complete", step });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			onEvent({ type: "step-error", step, error: message });
			break;
		}
	}

	onEvent({ type: "pipeline-complete" });
	return ctx;
};

export { executePipeline, MAIN_MODEL };

import { createChartAgent } from "@/lib/agent/multi-agents/chart-agent";
import { createDataAgent } from "@/lib/agent/multi-agents/data-agent";
import { runOrchestrator } from "@/lib/agent/multi-agents/orchestrator";
import { createReportAgent } from "@/lib/agent/multi-agents/report-agent";
import {
	buildStepPrompt,
	createInitialContext,
} from "@/lib/agent/pipeline/context";
import {
	type StepExecutionResult,
	formatStepFailure,
	formatToolError,
	resolveChartOutput,
	resolveDataOutput,
	resolveReportOutput,
} from "@/lib/agent/pipeline/output-resolver";
import type { SandboxSession } from "@/lib/e2b";
import type { FileRecord } from "@/types";
import type {
	AgentDefinition,
	PipelineContext,
	PipelineStep,
	PipelineStreamEvent,
} from "@/types/agent";
import { stepCountIs, streamText } from "ai";
import { zhipu } from "zhipu-ai-provider";

type ExecutorCallbacks = {
	onEvent: (event: PipelineStreamEvent) => void;
};

type StepToolResult = {
	toolName: string;
	output: unknown;
};

const MAIN_MODEL = process.env.GLM_MODEL ?? "glm-4.7-flash";

const executeStep = async (
	agent: AgentDefinition,
	stepPrompt: string,
	onDelta: (content: string) => void,
): Promise<StepExecutionResult> => {
	const result = await streamText({
		system: agent.systemPrompt,
		model: zhipu(MAIN_MODEL),
		messages: [{ role: "user", content: stepPrompt }],
		tools: agent.tools,
		stopWhen: stepCountIs(agent.maxSteps),
	});

	let fullText = "";
	const toolErrors: string[] = [];
	const toolResults: StepToolResult[] = [];

	for await (const part of result.fullStream) {
		switch (part.type) {
			case "text-delta":
				fullText += part.text;
				onDelta(part.text);
				break;
			case "tool-result":
				toolResults.push({
					toolName: part.toolName,
					output: part.output,
				});
				break;
			case "tool-error":
				toolErrors.push(formatToolError(part.toolName, part.error));
				break;
		}
	}

	return {
		text: fullText,
		toolErrors,
		toolResults,
	};
};

const executePipeline = async (
	userRequest: string,
	attachedFiles: FileRecord[],
	fileIds: string[],
	sandboxSession: SandboxSession,
	callbacks: ExecutorCallbacks,
): Promise<PipelineContext> => {
	const { onEvent } = callbacks;

	const pipelinePlan = await runOrchestrator(userRequest, attachedFiles);
	onEvent({ type: "plan", plan: pipelinePlan });

	if (pipelinePlan.steps.length === 0) {
		onEvent({ type: "pipeline-complete" });
		return createInitialContext(userRequest, attachedFiles, pipelinePlan);
	}

	const agentMap: Record<PipelineStep, AgentDefinition> = {
		data: createDataAgent({ fileIds, sandboxSession }),
		chart: createChartAgent({ fileIds, sandboxSession }),
		report: createReportAgent(sandboxSession),
	};

	const ctx = createInitialContext(userRequest, attachedFiles, pipelinePlan);

	for (const step of pipelinePlan.steps) {
		const agent = agentMap[step];
		let stepResult: StepExecutionResult | undefined;
		onEvent({ type: "step-start", step });

		try {
			const stepPrompt = buildStepPrompt(step, ctx);
			stepResult = await executeStep(agent, stepPrompt, (content: string) =>
				onEvent({ type: "step-delta", step, content }),
			);

			switch (step) {
				case "data": {
					const output = resolveDataOutput(stepResult);
					ctx.dataOutput = output;
					onEvent({ type: "step-complete", step, output });
					break;
				}
				case "chart": {
					const output = resolveChartOutput(stepResult);
					ctx.chartOutput = output;
					onEvent({ type: "step-complete", step, output });
					break;
				}
				case "report": {
					const output = resolveReportOutput(stepResult);
					ctx.reportOutput = output;
					onEvent({ type: "step-complete", step, output });
					break;
				}
			}
		} catch (error) {
			const message =
				error instanceof Error
					? formatStepFailure(error, stepResult?.toolErrors ?? [])
					: "Unknown error";
			onEvent({ type: "step-error", step, error: message });
			break;
		}
	}

	onEvent({ type: "pipeline-complete" });
	return ctx;
};

export { executePipeline, MAIN_MODEL };

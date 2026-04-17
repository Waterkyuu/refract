import { createChartAgent } from "@/lib/agent/agents/chart-agent";
import { createDataAgent } from "@/lib/agent/agents/data-agent";
import { runOrchestrator } from "@/lib/agent/agents/orchestrator";
import { createReportAgent } from "@/lib/agent/agents/report-agent";
import {
	buildStepPrompt,
	createInitialContext,
} from "@/lib/agent/pipeline/context";
import type { SandboxSession } from "@/lib/e2b";
import type { FileRecord } from "@/types";
import {
	type AgentDefinition,
	type ChartOutput,
	ChartOutputSchema,
	type DataOutput,
	DataOutputSchema,
	type PersistedArtifact,
	PersistedArtifactSchema,
	type PipelineContext,
	type PipelineStep,
	type PipelineStreamEvent,
	type ReportOutput,
	ReportOutputSchema,
} from "@/types/agent";
import { stepCountIs, streamText } from "ai";
import { zhipu } from "zhipu-ai-provider";
import { z } from "zod";

type ExecutorCallbacks = {
	onEvent: (event: PipelineStreamEvent) => void;
};

type StepToolResult = {
	toolName: string;
	output: unknown;
};

type StepExecutionResult = {
	text: string;
	toolResults: StepToolResult[];
};

const MAIN_MODEL = process.env.GLM_MODEL ?? "glm-4.7";

const RelaxedDataOutputSchema = DataOutputSchema.omit({
	artifact: true,
}).extend({
	artifact: PersistedArtifactSchema.optional(),
});

const RelaxedChartOutputSchema = ChartOutputSchema.extend({
	artifacts: z.array(PersistedArtifactSchema).optional(),
});

const RelaxedReportOutputSchema = ReportOutputSchema.omit({
	artifact: true,
}).extend({
	artifact: PersistedArtifactSchema.optional(),
});

const extractJsonCandidates = (text: string): string[] => {
	const candidates: string[] = [];
	let start = -1;
	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];

		if (!char) {
			continue;
		}

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (char === '"') {
			inString = !inString;
			continue;
		}

		if (inString) {
			continue;
		}

		if (char === "{") {
			if (depth === 0) {
				start = index;
			}
			depth += 1;
			continue;
		}

		if (char === "}" && depth > 0) {
			depth -= 1;
			if (depth === 0 && start >= 0) {
				candidates.push(text.slice(start, index + 1));
				start = -1;
			}
		}
	}

	return candidates;
};

const parseStructuredOutput = <T>(
	text: string,
	schema: z.ZodSchema<T>,
): T | undefined => {
	const candidates = extractJsonCandidates(text);

	for (let index = candidates.length - 1; index >= 0; index -= 1) {
		try {
			const parsed = JSON.parse(candidates[index] ?? "");
			const result = schema.safeParse(parsed);
			if (result.success) {
				return result.data;
			}
		} catch {
			// ignore malformed candidates
		}
	}

	return undefined;
};

const formatToolError = (toolName: string, error: unknown) => {
	if (error instanceof Error) {
		return `${toolName}: ${error.message}`;
	}

	if (typeof error === "string") {
		return `${toolName}: ${error}`;
	}

	try {
		return `${toolName}: ${JSON.stringify(error)}`;
	} catch {
		return `${toolName}: Unknown tool error`;
	}
};

const extractArtifactsFromToolResults = (
	toolResults: StepToolResult[],
	toolName: string,
): PersistedArtifact[] =>
	toolResults.flatMap(({ output, toolName: resultToolName }) => {
		if (resultToolName !== toolName || !output || typeof output !== "object") {
			return [];
		}

		const parsed = PersistedArtifactSchema.safeParse(output);
		return parsed.success ? [parsed.data] : [];
	});

const resolveDataOutput = (stepResult: StepExecutionResult): DataOutput => {
	const parsedOutput = parseStructuredOutput(
		stepResult.text,
		RelaxedDataOutputSchema,
	);
	const artifact =
		parsedOutput?.artifact ??
		extractArtifactsFromToolResults(
			stepResult.toolResults,
			"persistCodeFile",
		).find((candidate) => candidate.kind === "dataset") ??
		extractArtifactsFromToolResults(
			stepResult.toolResults,
			"persistCodeFile",
		).at(-1);

	if (!parsedOutput) {
		throw new Error("Data step did not produce a valid JSON summary.");
	}

	if (!artifact) {
		throw new Error("Data step did not persist the cleaned dataset.");
	}

	return DataOutputSchema.parse({
		...parsedOutput,
		artifact,
	});
};

const resolveChartOutput = (stepResult: StepExecutionResult): ChartOutput => {
	const parsedOutput = parseStructuredOutput(
		stepResult.text,
		RelaxedChartOutputSchema,
	);

	if (!parsedOutput) {
		throw new Error("Chart step did not produce a valid JSON summary.");
	}

	const artifacts = extractArtifactsFromToolResults(
		stepResult.toolResults,
		"persistLatestChart",
	);

	return ChartOutputSchema.parse({
		...parsedOutput,
		artifacts: artifacts.length > 0 ? artifacts : parsedOutput.artifacts,
	});
};

const resolveReportOutput = (stepResult: StepExecutionResult): ReportOutput => {
	const parsedOutput = parseStructuredOutput(
		stepResult.text,
		RelaxedReportOutputSchema,
	);
	const artifact =
		parsedOutput?.artifact ??
		extractArtifactsFromToolResults(
			stepResult.toolResults,
			"persistCodeFile",
		).find((candidate) => candidate.kind === "document") ??
		extractArtifactsFromToolResults(
			stepResult.toolResults,
			"persistCodeFile",
		).at(-1);

	if (!parsedOutput) {
		throw new Error("Report step did not produce a valid JSON summary.");
	}

	if (!artifact) {
		throw new Error("Report step did not persist the generated document.");
	}

	return ReportOutputSchema.parse({
		...parsedOutput,
		artifact,
	});
};

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

	if (toolErrors.length > 0) {
		throw new Error(toolErrors.join("\n"));
	}

	return {
		text: fullText,
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
		onEvent({ type: "step-start", step });

		try {
			const stepPrompt = buildStepPrompt(step, ctx);
			const stepResult = await executeStep(
				agent,
				stepPrompt,
				(content: string) => onEvent({ type: "step-delta", step, content }),
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
			const message = error instanceof Error ? error.message : "Unknown error";
			onEvent({ type: "step-error", step, error: message });
			break;
		}
	}

	onEvent({ type: "pipeline-complete" });
	return ctx;
};

export { executePipeline, MAIN_MODEL };

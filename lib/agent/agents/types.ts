import type { FileRecord } from "@/types";

type PipelineStep = "data" | "chart" | "report";

type PipelinePlan = {
	steps: PipelineStep[];
	reasoning: string;
	dataGoal?: string;
	chartGoal?: string;
	reportGoal?: string;
};

type DataOutput = {
	filePath: string;
	summary: string;
	stats: string;
	rowCount: number;
	columns: string[];
};

type ChartOutput = {
	chartCount: number;
	descriptions: string[];
};

type ReportOutput = {
	filePath: string;
	format: "markdown" | "typst";
};

type PipelineContext = {
	userRequest: string;
	attachedFiles: FileRecord[];
	plan: PipelinePlan;
	dataOutput?: DataOutput;
	chartOutput?: ChartOutput;
	reportOutput?: ReportOutput;
};

type StepStatus = "pending" | "running" | "completed" | "error";

type PipelineState = {
	plan: PipelinePlan | null;
	currentStep: PipelineStep | null;
	completedSteps: PipelineStep[];
	stepStatus: Record<PipelineStep, StepStatus>;
};

type AgentDefinition = {
	name: string;
	step: PipelineStep;
	systemPrompt: string;
	// biome-ignore lint/suspicious/noExplicitAny: ToolSet is not exported from ai
	tools: Record<string, any>;
	maxSteps: number;
};

type PipelineStreamEvent =
	| { type: "plan"; plan: PipelinePlan }
	| { type: "step-start"; step: PipelineStep }
	| { type: "step-delta"; step: PipelineStep; content: string }
	| {
			type: "step-complete";
			step: PipelineStep;
			output?: DataOutput | ChartOutput | ReportOutput;
	  }
	| { type: "step-error"; step: PipelineStep; error: string }
	| { type: "pipeline-complete" };

export type {
	PipelineStep,
	PipelinePlan,
	DataOutput,
	ChartOutput,
	ReportOutput,
	PipelineContext,
	StepStatus,
	PipelineState,
	AgentDefinition,
	PipelineStreamEvent,
};

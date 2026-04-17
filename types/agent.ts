import { DatasetPreviewSchema, type FileRecord } from "@/types";
import { z } from "zod";

const PipelineStepSchema = z.enum(["data", "chart", "report"]);

const PipelinePlanSchema = z.object({
	steps: z.array(PipelineStepSchema),
	reasoning: z.string(),
	dataGoal: z.string().optional(),
	chartGoal: z.string().optional(),
	reportGoal: z.string().optional(),
});

const PersistedArtifactSchema = z.object({
	fileId: z.string(),
	filename: z.string(),
	downloadUrl: z.string(),
	kind: z.enum(["dataset", "document"]).optional(),
	contentType: z.string().nullable().optional(),
	preview: DatasetPreviewSchema.optional(),
});

const DataOutputSchema = z.object({
	filePath: z.string(),
	summary: z.string(),
	stats: z.string(),
	rowCount: z.number().int().nonnegative(),
	columns: z.array(z.string()),
	artifact: PersistedArtifactSchema,
});

const ChartOutputSchema = z.object({
	chartCount: z.number().int().nonnegative(),
	descriptions: z.array(z.string()),
	artifacts: z.array(PersistedArtifactSchema).optional(),
});

const ReportOutputSchema = z.object({
	filePath: z.string(),
	format: z.enum(["markdown", "typst"]),
	artifact: PersistedArtifactSchema,
});

type PipelineStep = z.infer<typeof PipelineStepSchema>;
type PipelinePlan = z.infer<typeof PipelinePlanSchema>;
type PersistedArtifact = z.infer<typeof PersistedArtifactSchema>;
type DataOutput = z.infer<typeof DataOutputSchema>;
type ChartOutput = z.infer<typeof ChartOutputSchema>;
type ReportOutput = z.infer<typeof ReportOutputSchema>;

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
			output: DataOutput | ChartOutput | ReportOutput;
	  }
	| { type: "step-error"; step: PipelineStep; error: string }
	| { type: "pipeline-complete" };

export {
	PipelineStepSchema,
	PipelinePlanSchema,
	PersistedArtifactSchema,
	DataOutputSchema,
	ChartOutputSchema,
	ReportOutputSchema,
};
export type {
	PipelineStep,
	PipelinePlan,
	PersistedArtifact,
	DataOutput,
	ChartOutput,
	ReportOutput,
	PipelineContext,
	StepStatus,
	PipelineState,
	AgentDefinition,
	PipelineStreamEvent,
};

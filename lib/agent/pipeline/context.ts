import type {
	PipelineContext,
	PipelinePlan,
	PipelineStep,
} from "@/lib/agent/agents/types";
import type { FileRecord } from "@/types";

const formatAttachedFiles = (attachedFiles: FileRecord[]) => {
	if (attachedFiles.length === 0) {
		return "- none";
	}

	return attachedFiles
		.map(
			({ filename, kind, objectKey }) =>
				`- ${filename} -> ${kind ?? "document"} -> ${objectKey ?? "unresolved"}`,
		)
		.join("\n");
};

const buildStepPrompt = (step: PipelineStep, ctx: PipelineContext): string => {
	const base = `## User Request\n${ctx.userRequest}\n`;

	switch (step) {
		case "data":
			return `${base}
## Attached Files
Files are synced to /home/user/data/ in the code sandbox.
${formatAttachedFiles(ctx.attachedFiles)}

## Goal
${ctx.plan.dataGoal ?? "Read, inspect, clean, and summarize the data. Save cleaned data to /home/user/output/cleaned_data.csv"}`;

		case "chart":
			return `${base}
## Data Summary (from previous stage)
${ctx.dataOutput?.summary ?? "No data summary available"}

## Cleaned Data Path
${ctx.dataOutput?.filePath ?? "/home/user/output/cleaned_data.csv"}

## Key Statistics
${ctx.dataOutput?.stats ?? "N/A"}

## Columns (${ctx.dataOutput?.columns.length ?? 0})
${ctx.dataOutput?.columns.join(", ") ?? "unknown"}

## Row Count
${ctx.dataOutput?.rowCount ?? "unknown"}

## Goal
${ctx.plan.chartGoal ?? "Create appropriate visualizations from the cleaned data"}`;

		case "report":
			return `${base}
## Data Summary
${ctx.dataOutput?.summary ?? "No data summary available"}

## Key Statistics
${ctx.dataOutput?.stats ?? "N/A"}

## Charts (${ctx.chartOutput?.chartCount ?? 0} generated)
${ctx.chartOutput?.descriptions.map((d, i) => `### Chart ${i + 1}\n${d}`).join("\n\n") ?? "No charts generated"}

## Goal
${ctx.plan.reportGoal ?? "Write a comprehensive analysis report incorporating the data insights and chart descriptions"}`;
	}
};

const createInitialContext = (
	userRequest: string,
	attachedFiles: FileRecord[],
	plan: PipelinePlan,
): PipelineContext => ({
	userRequest,
	attachedFiles,
	plan,
});

export { buildStepPrompt, createInitialContext };

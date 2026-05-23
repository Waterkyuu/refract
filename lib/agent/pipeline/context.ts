import { formatSandboxAttachedFiles } from "@/lib/agent/utils/file-context";
import type { FileRecord } from "@/types";
import type {
	PipelineContext,
	PipelinePlan,
	PipelineStep,
} from "@/types/agent";

// Build prompts for each step
const buildStepPrompt = (step: PipelineStep, ctx: PipelineContext): string => {
	const base = `## User Request\n${ctx.userRequest}\n`;

	switch (step) {
		case "data":
			return `${base}
## Attached Files
Files are synced to /home/user/data/ in the code sandbox.
Only use the exact sandbox paths listed below. Do NOT prepend object keys, file IDs, or storage prefixes.
${formatSandboxAttachedFiles(ctx.attachedFiles)}

## Goal
${ctx.plan.dataGoal ?? "Read, inspect, clean, and summarize the data. Save cleaned data to /home/user/output/cleaned_data.csv"}

## Output Contract (Required)
- Your final assistant message must be EXACTLY one valid JSON object and no extra text.
- Include all fields: filePath, summary, stats, rowCount, columns, artifact.
- artifact must come from persistCodeFile result and include fileId, filename, downloadUrl.`;

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
${ctx.plan.chartGoal ?? "Create appropriate visualizations from the cleaned data"}

## Output Contract (Required)
- Your final assistant message must be EXACTLY one valid JSON object and no extra text.
- Include all fields: chartCount, descriptions, artifacts.
- If chart execution fails, still return valid JSON with chartCount=0 and a failure reason in descriptions.`;

		case "report": {
			const chartArtifacts = ctx.chartOutput?.artifacts ?? [];
			const chartDescriptions = ctx.chartOutput?.descriptions ?? [];
			const chartSection =
				chartArtifacts.length > 0
					? chartArtifacts
							.map((a, i) => {
								const desc = chartDescriptions[i] ?? `Chart ${i + 1}`;
								return `### Chart ${i + 1}\n- Description: ${desc}\n- Image URL: ![${desc}](${a.downloadUrl})\n- fileId: ${a.fileId}`;
							})
							.join("\n\n")
					: chartDescriptions.length > 0
						? chartDescriptions
								.map((d, i) => `### Chart ${i + 1}\n${d}`)
								.join("\n\n")
						: "No charts generated";

			return `${base}
## Data Summary
${ctx.dataOutput?.summary ?? "No data summary available"}

## Key Statistics
${ctx.dataOutput?.stats ?? "N/A"}

## Charts (${ctx.chartOutput?.chartCount ?? 0} generated)
${chartSection}

## Goal
${ctx.plan.reportGoal ?? "Write a comprehensive analysis report incorporating the data insights and chart images. Use the provided chart Image URLs to embed the actual chart images in the report."}`;
		}
	}
};

// Create the initial pipeline context
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

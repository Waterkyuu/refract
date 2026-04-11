import type { FileRecord } from "@/types";
import { generateText } from "ai";
import { zhipu } from "zhipu-ai-provider";
import type { PipelinePlan } from "./types";

const ORCHESTRATOR_PROMPT = `You are a pipeline planner for a data analysis system. Analyze the user's request and decide which processing stages are needed.

Available stages:
- data: Read files, clean data, handle missing values, merge datasets, compute summary statistics
- chart: Generate visualizations (line, bar, scatter, pie, heatmap, etc.) from cleaned data
- report: Write analysis reports or documents in Markdown/Typst incorporating data insights and charts

Rules:
- "data" must come before "chart" if charts reference data
- "data" must come before "report" if the report needs data insights
- "chart" is optional — only include if the user wants visualizations
- "report" is optional — only include if the user wants a written document
- For a quick chart: ["data", "chart"]
- For a full analysis: ["data", "chart", "report"]
- For simple data inspection: ["data"] only
- If the request is unrelated to data/charts/reports, return an empty steps array

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "steps": ["data", "chart", "report"],
  "reasoning": "brief explanation of why these stages were chosen",
  "dataGoal": "what the data stage should accomplish",
  "chartGoal": "what charts to generate",
  "reportGoal": "what the report should cover"
}

If the request does not need any pipeline stage, respond with:
{
  "steps": [],
  "reasoning": "explanation"
}`;

const FAST_MODEL = process.env.GLM_FAST_MODEL ?? "glm-4.5-x";

const parsePlanFromText = (text: string): PipelinePlan => {
	const jsonMatch = text.match(/\{[\s\S]*"steps"[\s\S]*\}/);
	if (!jsonMatch) {
		return {
			steps: [],
			reasoning: "Could not parse plan from orchestrator response",
		};
	}

	try {
		const parsed = JSON.parse(jsonMatch[0]) as PipelinePlan;
		if (!Array.isArray(parsed.steps)) {
			return { steps: [], reasoning: "Invalid plan: steps is not an array" };
		}

		const validSteps = ["data", "chart", "report"] as const;
		parsed.steps = parsed.steps.filter((s: string) =>
			validSteps.includes(s as "data" | "chart" | "report"),
		) as PipelinePlan["steps"];

		return parsed;
	} catch {
		return { steps: [], reasoning: "Failed to parse plan JSON" };
	}
};

const runOrchestrator = async (
	userRequest: string,
	attachedFiles: FileRecord[],
): Promise<PipelinePlan> => {
	const fileList =
		attachedFiles.length > 0
			? attachedFiles
					.map((f) => `- ${f.filename} (${f.kind ?? "unknown"})`)
					.join("\n")
			: "No files attached";

	const userMessage = `User request: ${userRequest}\n\nAttached files:\n${fileList}`;

	const result = await generateText({
		model: zhipu(FAST_MODEL),
		system: ORCHESTRATOR_PROMPT,
		messages: [{ role: "user", content: userMessage }],
		maxOutputTokens: 512,
	});

	return parsePlanFromText(result.text);
};

export { runOrchestrator, ORCHESTRATOR_PROMPT };

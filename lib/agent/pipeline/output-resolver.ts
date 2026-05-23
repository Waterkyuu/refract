import { formatUnknownError } from "@/lib/agent/utils/error-utils";
import {
	type ChartOutput,
	ChartOutputSchema,
	type DataOutput,
	DataOutputSchema,
	type PersistedArtifact,
	PersistedArtifactSchema,
	type ReportOutput,
	ReportOutputSchema,
} from "@/types/agent";
import { z } from "zod";

type StepToolResult = {
	toolName: string;
	output: unknown;
};

type StepExecutionResult = {
	text: string;
	toolErrors: string[];
	toolResults: StepToolResult[];
};

const DEFAULT_CLEANED_DATA_PATH = "/home/user/output/cleaned_data.csv";

const RelaxedDataOutputSchema = DataOutputSchema.omit({
	artifact: true,
}).extend({
	artifact: PersistedArtifactSchema.optional(),
});

const BestEffortDataOutputSchema = z.object({
	filePath: z.string().optional(),
	summary: z.string().optional(),
	stats: z.string().optional(),
	rowCount: z.coerce.number().int().nonnegative().optional(),
	columns: z.array(z.string()).optional(),
	artifact: PersistedArtifactSchema.optional(),
});

const RelaxedChartOutputSchema = ChartOutputSchema.extend({
	artifacts: z.array(PersistedArtifactSchema).optional(),
});

const BestEffortChartOutputSchema = z.object({
	chartCount: z.coerce.number().int().nonnegative().optional(),
	descriptions: z.array(z.string()).optional(),
	artifacts: z.array(PersistedArtifactSchema).optional(),
});

// --- JSON extraction & structured parsing ---
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

const parseStructuredOutputFromTexts = <T>(
	texts: string[],
	schema: z.ZodSchema<T>,
): T | undefined => {
	for (const text of texts) {
		const parsed = parseStructuredOutput(text, schema);
		if (parsed) {
			return parsed;
		}
	}

	return undefined;
};

// --- Tool result extraction ---
const extractTextCandidatesFromToolResults = (
	toolResults: StepToolResult[],
): string[] =>
	toolResults.flatMap(({ output }) => {
		if (!output || typeof output !== "object") {
			return [];
		}

		const outputRecord = output as Record<string, unknown>;
		const textCandidates: string[] = [];

		const pushCandidate = (candidate: unknown) => {
			if (typeof candidate === "string" && candidate.trim().length > 0) {
				textCandidates.push(candidate);
				return;
			}

			if (candidate && typeof candidate === "object") {
				try {
					textCandidates.push(JSON.stringify(candidate));
				} catch {
					// ignore non-serializable values
				}
			}
		};

		pushCandidate(outputRecord.text);
		pushCandidate(outputRecord.data);
		pushCandidate(outputRecord.json);
		pushCandidate(outputRecord.markdown);
		pushCandidate(outputRecord.html);

		if (Array.isArray(outputRecord.stdout)) {
			for (const line of outputRecord.stdout) {
				pushCandidate(line);
			}
		}

		if (Array.isArray(outputRecord.stderr)) {
			for (const line of outputRecord.stderr) {
				pushCandidate(line);
			}
		}

		if (Array.isArray(outputRecord.results)) {
			for (const result of outputRecord.results) {
				pushCandidate(result);
			}
		}

		return textCandidates;
	});

const extractLikelyCsvPath = (texts: string[]): string | undefined => {
	const csvPathRegex = /\/home\/user\/output\/[^\s"'`]+\.csv/g;
	const matches = texts.flatMap((text) =>
		Array.from(text.matchAll(csvPathRegex)),
	);
	const lastMatch = matches.at(-1);
	return lastMatch?.[0];
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

// --- Text normalization ---

const normalizeSummaryText = (text: string): string | undefined => {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (normalized.length === 0) {
		return undefined;
	}

	return normalized.slice(0, 600);
};

const buildFallbackDataStats = (
	rowCount: number,
	columns: string[],
): string => {
	const columnsLabel = columns.length > 0 ? columns.join(", ") : "unknown";
	return `Rows: ${rowCount}. Columns (${columns.length}): ${columnsLabel}.`;
};

// --- Error formatting ---
const formatToolError = (toolName: string, error: unknown) => {
	return `${toolName}: ${formatUnknownError(error)}`;
};

const formatStepFailure = (error: Error, toolErrors: string[]) => {
	if (toolErrors.length === 0) {
		return error.message;
	}

	const uniqueToolErrors = [...new Set(toolErrors)];
	return `${uniqueToolErrors.join("\n\n")}\n\n${error.message}`;
};

// --- Fallback helpers ---

const firstDefined = <T>(...candidates: (T | undefined)[]): T =>
	candidates.find((c): c is T => c !== undefined) as T;

const firstNonEmpty = <T>(...candidates: (T[] | undefined)[]): T[] =>
	candidates.find((c): c is T[] => Array.isArray(c) && c.length > 0) ?? [];

// --- Resolve functions ---
/**
 * Resolve a structured DataOutput from the raw result of the "data" pipeline step.
 *
 * Uses a three-tier fallback strategy per field:
 *   1. Strict JSON parsed from LLM text → 2. Best-effort JSON → 3. Raw tool result fallback.
 *
 * @param stepResult - Raw execution result from the data step.
 *   { text: "I cleaned the dataset...", toolErrors: [], toolResults: [{ toolName: "persistCodeFile", result: { artifact: {...} } }] }
 *
 * @returns Validated DataOutput object.
 *   { filePath: "/home/user/output/cleaned_data.csv", summary: "Removed 12 null rows...", stats: "100 rows x 5 cols",
 *     rowCount: 100, columns: ["name","age","city","score","date"], artifact: { kind: "dataset", filename: "cleaned_data.csv", ... } }
 */
const resolveDataOutput = (stepResult: StepExecutionResult): DataOutput => {
	const textCandidates = [
		stepResult.text,
		...extractTextCandidatesFromToolResults(stepResult.toolResults),
	].filter((text) => text.trim().length > 0);

	const parsedOutput = parseStructuredOutputFromTexts(
		textCandidates,
		RelaxedDataOutputSchema,
	);
	const bestEffortOutput = parseStructuredOutputFromTexts(
		textCandidates,
		BestEffortDataOutputSchema,
	);

	const persistedArtifacts = extractArtifactsFromToolResults(
		stepResult.toolResults,
		"persistCodeFile",
	);

	const artifact =
		parsedOutput?.artifact ??
		bestEffortOutput?.artifact ??
		persistedArtifacts.find((c) => c.kind === "dataset") ??
		persistedArtifacts.at(-1);

	if (!artifact) {
		throw new Error("Data step did not persist the cleaned dataset.");
	}

	const columns = firstNonEmpty(
		parsedOutput?.columns,
		bestEffortOutput?.columns,
		[],
	);
	const rowCount = firstDefined(
		parsedOutput?.rowCount,
		bestEffortOutput?.rowCount,
		0,
	);
	const summary = firstDefined(
		parsedOutput?.summary,
		bestEffortOutput?.summary,
		normalizeSummaryText(stepResult.text),
		`Cleaned dataset persisted as ${artifact.filename}.`,
	);
	const filePath = firstDefined(
		parsedOutput?.filePath,
		bestEffortOutput?.filePath,
		extractLikelyCsvPath(textCandidates),
		DEFAULT_CLEANED_DATA_PATH,
	);
	const stats = firstDefined(
		parsedOutput?.stats,
		bestEffortOutput?.stats,
		buildFallbackDataStats(rowCount, columns),
	);

	return DataOutputSchema.parse({
		filePath,
		summary,
		stats,
		rowCount,
		columns,
		artifact,
	});
};

/**
 * Resolve a structured ChartOutput from the raw result of the "chart" pipeline step.
 *
 * Uses a three-tier fallback strategy per field:
 *   1. Strict JSON parsed from LLM text → 2. Best-effort JSON → 3. Raw tool result fallback.
 *
 * @param stepResult - Raw execution result from the chart step.
 *   { text: "Generated 3 charts...", toolErrors: [], toolResults: [{ toolName: "persistLatestChart", result: { artifact: {...} } }] }
 *
 * @returns Validated ChartOutput object.
 *   { chartCount: 3, descriptions: ["Bar chart of sales by region", "Line chart of trends", "Pie chart of distribution"],
 *     artifacts: [{ kind: "image", filename: "chart_1.png", ... }] }
 */
const resolveChartOutput = (stepResult: StepExecutionResult): ChartOutput => {
	const textCandidates = [
		stepResult.text,
		...extractTextCandidatesFromToolResults(stepResult.toolResults),
	].filter((text) => text.trim().length > 0);

	const parsedOutput = parseStructuredOutputFromTexts(
		textCandidates,
		RelaxedChartOutputSchema,
	);
	const bestEffortOutput = parseStructuredOutputFromTexts(
		textCandidates,
		BestEffortChartOutputSchema,
	);

	const persistAllChartsResult = stepResult.toolResults.find(
		({ toolName, output }) =>
			toolName === "persistAllCharts" &&
			output &&
			typeof output === "object" &&
			Array.isArray((output as Record<string, unknown>).artifacts),
	);
	const toolArtifacts =
		persistAllChartsResult &&
		Array.isArray(
			(persistAllChartsResult.output as Record<string, unknown>).artifacts,
		)
			? (
					(persistAllChartsResult.output as Record<string, unknown>)
						.artifacts as Array<Record<string, unknown>>
				)
					.filter((a) => typeof a.fileId === "string")
					.map((a) => ({
						contentType: a.contentType as string | null | undefined,
						downloadUrl: a.downloadUrl as string,
						fileId: a.fileId as string,
						fileSize: a.fileSize as number | null | undefined,
						filename: a.filename as string,
						kind: a.kind as "dataset" | "document" | undefined,
					}))
			: [];
	const outputArtifacts =
		toolArtifacts.length > 0
			? toolArtifacts
			: (parsedOutput?.artifacts ?? bestEffortOutput?.artifacts);

	const fallbackDescription =
		stepResult.toolErrors.length > 0
			? `Chart generation encountered tool errors: ${stepResult.toolErrors.join(" | ")}`
			: firstDefined(
					normalizeSummaryText(stepResult.text),
					"Chart generation did not complete successfully in this run.",
				);
	const descriptions = firstNonEmpty(
		parsedOutput?.descriptions,
		bestEffortOutput?.descriptions,
		[fallbackDescription],
	);
	const chartCount = firstDefined(
		parsedOutput?.chartCount,
		bestEffortOutput?.chartCount,
		outputArtifacts?.length,
		0,
	);

	return ChartOutputSchema.parse({
		chartCount,
		descriptions,
		artifacts: outputArtifacts,
	});
};

const extractMarkdownContent = (text: string): string | undefined => {
	const match = text.match(/```markdown\n([\s\S]*?)```/);
	return match?.[1]?.trim() || undefined;
};

const resolveReportOutput = (stepResult: StepExecutionResult): ReportOutput => {
	const markdownContent = extractMarkdownContent(stepResult.text);

	if (!markdownContent) {
		throw new Error("Report step did not produce markdown content.");
	}

	return ReportOutputSchema.parse({
		markdownContent,
	});
};

export type { StepExecutionResult };
export {
	formatStepFailure,
	formatToolError,
	resolveChartOutput,
	resolveDataOutput,
	resolveReportOutput,
};

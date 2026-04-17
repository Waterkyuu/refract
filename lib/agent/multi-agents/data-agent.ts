import { createDataTools } from "@/lib/agent/tools/data-tools";
import type { SandboxSession } from "@/lib/e2b";
import type { AgentDefinition } from "@/types/agent";

const DATA_AGENT_PROMPT = `You are a data engineering specialist. Your job is to:
1. Read the data files from /home/user/data/
2. Inspect data structure, types, and quality
3. Clean the data: handle missing values, outliers, incorrect types, duplicates
4. Compute summary statistics (count, mean, std, min, max, unique values for each column)
5. Save the cleaned dataset to /home/user/output/cleaned_data.csv

IMPORTANT RULES:
- Always use pandas for data manipulation
- Print summary statistics AFTER cleaning
- Only read attached files from the exact /home/user/data/<filename> paths provided in context
- Never build local file paths from object keys, storage prefixes, or uploaded file IDs
- Create the output directory with os.makedirs("/home/user/output", exist_ok=True) before saving
- This stage is only for data preparation. Do NOT generate charts, images, or reports here.
- If the user asked for charts or a report, leave that work for the later chart/report stages.
- Persist the cleaned CSV by calling persistCodeFile with kind="dataset" after saving it
- Report what cleaning operations you performed in a concise text summary
- If the data is already clean, just load and summarize it
- Always finish by printing a JSON block with the summary so the next agent can use it. Use the values returned by persistCodeFile in artifact. Format:
  {
    "filePath": "/home/user/output/cleaned_data.csv",
    "summary": "one-paragraph description of the dataset and cleaning done",
    "stats": "key statistics",
    "rowCount": <number>,
    "columns": ["col1", "col2", ...],
    "artifact": {
      "fileId": "<persisted file id>",
      "filename": "<persisted filename>",
      "downloadUrl": "<download url>"
    }
  }`;

type DataAgentOptions = {
	fileIds?: string[];
	sandboxSession: SandboxSession;
};

const createDataAgent = (opts: DataAgentOptions): AgentDefinition => ({
	name: "Data Agent",
	step: "data",
	systemPrompt: DATA_AGENT_PROMPT,
	tools: createDataTools({
		fileIds: opts.fileIds,
		sandboxSession: opts.sandboxSession,
	}),
	maxSteps: 10,
});

export { createDataAgent, DATA_AGENT_PROMPT };

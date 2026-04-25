import type { SandboxSession } from "@/lib/agent/sandbox/e2b";
import {
	createCodeInterpreterTool,
	createPersistAllChartsTool,
} from "./shared";

type ChartToolsOptions = {
	fileIds?: string[];
	sandboxSession: SandboxSession;
};

const createChartTools = ({
	fileIds = [],
	sandboxSession,
}: ChartToolsOptions) => ({
	codeInterpreter: createCodeInterpreterTool({ fileIds, sandboxSession }),
	persistAllCharts: createPersistAllChartsTool(sandboxSession),
});

export { createChartTools };

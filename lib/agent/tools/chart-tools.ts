import type { SandboxSession } from "@/lib/e2b";
import {
	createCodeInterpreterTool,
	createPersistLatestChartTool,
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
	persistLatestChart: createPersistLatestChartTool(sandboxSession),
});

export { createChartTools };

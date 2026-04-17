import type { SandboxSession } from "@/lib/e2b";
import { createCodeInterpreterTool, createPersistCodeFileTool } from "./shared";

type DataToolsOptions = {
	fileIds?: string[];
	sandboxSession: SandboxSession;
};

const createDataTools = ({
	fileIds = [],
	sandboxSession,
}: DataToolsOptions) => ({
	codeInterpreter: createCodeInterpreterTool({ fileIds, sandboxSession }),
	persistCodeFile: createPersistCodeFileTool(sandboxSession),
});

export { createDataTools };

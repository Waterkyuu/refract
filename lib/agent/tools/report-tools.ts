import type { SandboxSession } from "@/lib/agent/sandbox/e2b";
import { createLoadSkillTool } from "@/lib/agent/tools/skill-tools";
import { createCodeInterpreterTool, createPersistCodeFileTool } from "./shared";

const createReportTools = (sandboxSession: SandboxSession) => ({
	codeInterpreter: createCodeInterpreterTool({ fileIds: [], sandboxSession }),
	persistCodeFile: createPersistCodeFileTool(sandboxSession),
	loadSkill: createLoadSkillTool(),
});

export { createReportTools };

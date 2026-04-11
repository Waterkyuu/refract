import { createCodeInterpreterTool, createPersistCodeFileTool } from "./shared";

type DataToolsOptions = {
	fileIds?: string[];
};

const createDataTools = ({ fileIds = [] }: DataToolsOptions = {}) => ({
	codeInterpreter: createCodeInterpreterTool({ fileIds }),
	persistCodeFile: createPersistCodeFileTool(),
});

export { createDataTools };

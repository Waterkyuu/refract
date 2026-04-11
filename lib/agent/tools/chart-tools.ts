import {
	createCodeInterpreterTool,
	createPersistLatestChartTool,
} from "./shared";

type ChartToolsOptions = {
	fileIds?: string[];
};

const createChartTools = ({ fileIds = [] }: ChartToolsOptions = {}) => ({
	codeInterpreter: createCodeInterpreterTool({ fileIds }),
	persistLatestChart: createPersistLatestChartTool(),
});

export { createChartTools };

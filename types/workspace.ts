type WorkspaceView =
	| "empty"
	| "vnc"
	| "chart"
	| "dataset"
	| "file"
	| "markdown";

type WorkspaceChartImage = {
	downloadUrl?: string;
	fileId?: string;
	filename?: string;
};

type WorkspaceChart = {
	generatedAt: number;
	images: WorkspaceChartImage[];
	title?: string;
	toolCallId: string;
};

type WorkspaceDataset = {
	downloadUrl?: string;
	fileId: string;
	filename: string;
};

type WorkspaceFile = {
	downloadUrl?: string;
	extension: string;
	fileId: string;
	filename: string;
	fileSize?: number;
};

export type {
	WorkspaceChart,
	WorkspaceChartImage,
	WorkspaceDataset,
	WorkspaceFile,
	WorkspaceView,
};

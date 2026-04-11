import type { DatasetPreview } from "./file";

type WorkspaceView = "empty" | "vnc" | "chart" | "dataset" | "file" | "typst";

type WorkspaceChart = {
	chart?: Record<string, unknown>;
	downloadUrl?: string;
	fileId?: string;
	filename?: string;
	generatedAt: number;
	png?: string;
	title?: string;
	toolCallId: string;
};

type WorkspaceDataset = {
	fileId: string;
	filename: string;
	preview: DatasetPreview;
};

type WorkspaceFile = {
	downloadUrl?: string;
	extension: string;
	fileId: string;
	filename: string;
	fileSize?: number;
};

export type { WorkspaceChart, WorkspaceDataset, WorkspaceFile, WorkspaceView };

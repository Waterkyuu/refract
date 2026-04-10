"use client";

import {
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	showFileWorkspaceAtom,
	showVncWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
	workspaceViewAtom,
} from "@/atoms/chat";
import FileCard from "@/components/share/file-card";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file";
import { cn } from "@/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { BarChart3, FileSpreadsheet, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { VncViewer } from "./vnc-panel";

const toImageSrc = (value?: string) => {
	if (!value) {
		return "";
	}

	return value.startsWith("data:") ? value : `data:image/png;base64,${value}`;
};

const DatasetPanel = memo(() => {
	const dataset = useAtomValue(workspaceDatasetAtom);
	const t = useTranslations("chat");

	if (!dataset?.preview) {
		return (
			<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
				{t("waitingDataset")}
			</div>
		);
	}

	const { preview } = dataset;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="border-b px-4 py-3">
				<p className="font-medium text-sm">{dataset.filename}</p>
				<p className="text-muted-foreground text-xs">
					{t("datasetSummary", {
						rows: preview.totalRows,
						columns: preview.totalColumns,
						sheet: preview.activeSheet || "-",
					})}
				</p>
			</div>
			<div className="min-h-0 flex-1 overflow-auto">
				<table className="min-w-full border-collapse text-left text-xs sm:text-sm">
					<thead className="sticky top-0 bg-background">
						<tr className="border-b">
							{preview.columns.map((column) => (
								<th
									key={column}
									className="whitespace-nowrap px-3 py-2 font-medium"
								>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{preview.rows.map((row, rowIndex) => (
							<tr key={`${dataset.fileId}-${rowIndex}`} className="border-b">
								{row.map((cell, cellIndex) => (
									<td
										key={`${dataset.fileId}-${rowIndex}-${cellIndex}`}
										className="max-w-56 truncate px-3 py-2 text-muted-foreground"
										title={cell}
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
});

DatasetPanel.displayName = "DatasetPanel";

const ChartPanel = memo(() => {
	const chart = useAtomValue(workspaceChartAtom);
	const t = useTranslations("chat");
	const imageSrc = toImageSrc(chart?.png);

	if (!chart) {
		return (
			<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
				{t("waitingChart")}
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="border-b px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="font-medium text-sm">
							{chart.title || t("chartViewer")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("chartGeneratedAt", {
								time: new Date(chart.generatedAt).toLocaleTimeString(),
							})}
						</p>
					</div>
					{chart.downloadUrl && (
						<Button asChild size="sm" variant="outline">
							<a href={chart.downloadUrl}>{t("downloadArtifact")}</a>
						</Button>
					)}
				</div>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-4">
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={chart.title || t("chartViewer")}
						className="mx-auto max-h-full rounded-xl border bg-white shadow-sm"
					/>
				) : (
					<pre className="overflow-auto rounded-xl border bg-background p-4 text-xs">
						{JSON.stringify(chart.chart, null, 2)}
					</pre>
				)}
			</div>
		</div>
	);
});

ChartPanel.displayName = "ChartPanel";

const FileInfoPanel = memo(() => {
	const file = useAtomValue(workspaceFileAtom);
	const t = useTranslations("chat");

	if (!file) {
		return (
			<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
				{t("workspaceEmpty")}
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="border-b px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="font-medium text-sm">{file.filename}</p>
						<p className="text-muted-foreground text-xs">
							{`${file.extension}${file.fileSize ? ` · ${formatFileSize(file.fileSize)}` : ""}`}
						</p>
					</div>
					{file.downloadUrl && (
						<Button asChild size="sm" variant="outline">
							<a href={file.downloadUrl}>{t("downloadArtifact")}</a>
						</Button>
					)}
				</div>
			</div>
			<div className="flex flex-1 items-start p-4">
				<FileCard
					className="w-full max-w-sm"
					extension={file.extension}
					fileName={file.filename}
					fileSize={file.fileSize}
				/>
			</div>
		</div>
	);
});

FileInfoPanel.displayName = "FileInfoPanel";

const WorkspacePanel = () => {
	const t = useTranslations("chat");
	const activeView = useAtomValue(workspaceViewAtom);
	const vncUrl = useAtomValue(vncUrlAtom);
	const chart = useAtomValue(workspaceChartAtom);
	const dataset = useAtomValue(workspaceDatasetAtom);
	const file = useAtomValue(workspaceFileAtom);
	const showVnc = useSetAtom(showVncWorkspaceAtom);
	const showChart = useSetAtom(showChartWorkspaceAtom);
	const showDataset = useSetAtom(showDatasetWorkspaceAtom);
	const showFile = useSetAtom(showFileWorkspaceAtom);

	const availableViews = useMemo(() => {
		const views: Array<{
			icon: typeof Monitor;
			key: "vnc" | "chart" | "dataset" | "file";
			label: string;
			onClick: () => void;
		}> = [];

		if (vncUrl) {
			views.push({
				key: "vnc",
				label: t("sandboxViewer"),
				icon: Monitor,
				onClick: () => showVnc(),
			});
		}
		if (chart) {
			views.push({
				key: "chart",
				label: t("chartViewer"),
				icon: BarChart3,
				onClick: () => showChart(chart),
			});
		}
		if (dataset) {
			views.push({
				key: "dataset",
				label: t("datasetViewer"),
				icon: FileSpreadsheet,
				onClick: () => showDataset(dataset),
			});
		}
		if (file) {
			views.push({
				key: "file",
				label: file.filename,
				icon: FileSpreadsheet,
				onClick: () => showFile(file),
			});
		}

		return views;
	}, [
		chart,
		dataset,
		file,
		showChart,
		showDataset,
		showFile,
		showVnc,
		t,
		vncUrl,
	]);

	const effectiveView = useMemo(() => {
		if (activeView === "file" && file) return "file";
		if (activeView === "dataset" && dataset) return "dataset";
		if (activeView === "chart" && chart) return "chart";
		if (activeView === "vnc" && vncUrl) return "vnc";
		if (dataset) return "dataset";
		if (file) return "file";
		if (chart) return "chart";
		if (vncUrl) return "vnc";
		return "empty";
	}, [activeView, chart, dataset, file, vncUrl]);

	return (
		<div className="flex h-full w-full flex-col bg-muted/30">
			<div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
				{availableViews.length > 0 ? (
					availableViews.map((view) => {
						const Icon = view.icon;
						return (
							<Button
								key={view.key}
								type="button"
								variant={effectiveView === view.key ? "default" : "outline"}
								size="sm"
								className={cn("gap-2 transition-colors duration-200")}
								onClick={view.onClick}
							>
								<Icon className="size-4" />
								{view.label}
							</Button>
						);
					})
				) : (
					<span className="text-muted-foreground text-sm">
						{t("workspaceEmpty")}
					</span>
				)}
			</div>

			<div className="min-h-0 flex-1 overflow-hidden">
				{effectiveView === "dataset" && <DatasetPanel />}
				{effectiveView === "file" && <FileInfoPanel />}
				{effectiveView === "chart" && <ChartPanel />}
				{effectiveView === "vnc" && <VncViewer url={vncUrl} />}
				{effectiveView === "empty" && (
					<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
						{t("workspaceEmpty")}
					</div>
				)}
			</div>
		</div>
	);
};

export default memo(WorkspacePanel);

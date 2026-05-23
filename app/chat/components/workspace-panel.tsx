"use client";

import {
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	showFileWorkspaceAtom,
	showMarkdownWorkspaceAtom,
	showVncWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
	workspaceHydratingAtom,
	workspaceMarkdownContentAtom,
	workspaceViewAtom,
} from "@/atoms/chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { BarChart3, FileSpreadsheet, FileText, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import ChartPanel from "./chart-panel";
import DatasetPanel from "./dataset-panel";
import FileInfoPanel from "./file-info-panel";
import MarkdownPreview from "./markdown-preview-panel";
import VncPanel from "./vnc-panel";

const WorkspacePanel = () => {
	const t = useTranslations("chat");
	const isWorkspaceHydrating = useAtomValue(workspaceHydratingAtom);
	const activeView = useAtomValue(workspaceViewAtom);
	const vncUrl = useAtomValue(vncUrlAtom);
	const chart = useAtomValue(workspaceChartAtom);
	const dataset = useAtomValue(workspaceDatasetAtom);
	const file = useAtomValue(workspaceFileAtom);
	const markdownContent = useAtomValue(workspaceMarkdownContentAtom);
	const showVnc = useSetAtom(showVncWorkspaceAtom);
	const showChart = useSetAtom(showChartWorkspaceAtom);
	const showDataset = useSetAtom(showDatasetWorkspaceAtom);
	const showFile = useSetAtom(showFileWorkspaceAtom);
	const showMarkdown = useSetAtom(showMarkdownWorkspaceAtom);

	const availableViews = useMemo(() => {
		const views: Array<{
			icon: typeof Monitor;
			key: "vnc" | "chart" | "dataset" | "file" | "markdown";
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
		if (markdownContent) {
			views.push({
				key: "markdown",
				label: t("textViewer"),
				icon: FileText,
				onClick: () => showMarkdown(markdownContent),
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
		showMarkdown,
		showVnc,
		t,
		markdownContent,
		vncUrl,
	]);

	const dataMap = useMemo(
		() =>
			[
				["dataset", dataset],
				["file", file],
				["markdown", markdownContent],
				["chart", chart],
				["vnc", vncUrl],
			] as const,
		[chart, dataset, file, markdownContent, vncUrl],
	);

	const effectiveView = useMemo(() => {
		const activeMatch = dataMap.find(
			([key, data]) => key === activeView && data,
		);
		if (activeMatch) return activeMatch[0];
		const fallback = dataMap.find(([, data]) => data);
		return fallback?.[0] ?? "empty";
	}, [activeView, dataMap]);

	if (isWorkspaceHydrating) {
		return (
			<div
				className="flex h-full w-full flex-col bg-muted/30"
				data-testid="workspace-panel-skeleton"
			>
				<div className="flex items-center gap-2 border-b px-4 py-3">
					<div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
					<div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
				</div>
				<div className="min-h-0 flex-1 p-4">
					<div className="h-full w-full animate-pulse rounded-xl border bg-background/70" />
				</div>
			</div>
		);
	}

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
				{effectiveView === "markdown" && <MarkdownPreview />}
				{effectiveView === "vnc" && <VncPanel />}
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

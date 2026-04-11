"use client";

import {
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	showFileWorkspaceAtom,
	showTypstWorkspaceAtom,
	showVncWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
	workspaceTypstContentAtom,
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
import TypstPreview from "./typst-preview-panel";
import VncPanel from "./vnc-panel";

const WorkspacePanel = () => {
	const t = useTranslations("chat");
	const activeView = useAtomValue(workspaceViewAtom);
	const vncUrl = useAtomValue(vncUrlAtom);
	const chart = useAtomValue(workspaceChartAtom);
	const dataset = useAtomValue(workspaceDatasetAtom);
	const file = useAtomValue(workspaceFileAtom);
	const typstContent = useAtomValue(workspaceTypstContentAtom);
	const showVnc = useSetAtom(showVncWorkspaceAtom);
	const showChart = useSetAtom(showChartWorkspaceAtom);
	const showDataset = useSetAtom(showDatasetWorkspaceAtom);
	const showFile = useSetAtom(showFileWorkspaceAtom);
	const showTypst = useSetAtom(showTypstWorkspaceAtom);

	const availableViews = useMemo(() => {
		const views: Array<{
			icon: typeof Monitor;
			key: "vnc" | "chart" | "dataset" | "file" | "typst";
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
		if (typstContent) {
			views.push({
				key: "typst",
				label: t("typstViewer"),
				icon: FileText,
				onClick: () => showTypst(typstContent),
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
		showTypst,
		showVnc,
		t,
		typstContent,
		vncUrl,
	]);

	const dataMap = useMemo(
		() =>
			[
				["dataset", dataset],
				["file", file],
				["typst", typstContent],
				["chart", chart],
				["vnc", vncUrl],
			] as const,
		[chart, dataset, file, typstContent, vncUrl],
	);

	const effectiveView = useMemo(() => {
		const activeMatch = dataMap.find(
			([key, data]) => key === activeView && data,
		);
		if (activeMatch) return activeMatch[0];
		const fallback = dataMap.find(([, data]) => data);
		return fallback?.[0] ?? "empty";
	}, [activeView, dataMap]);

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
				{effectiveView === "typst" && (
					<TypstPreview content={typstContent} isShowToC={false} />
				)}
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

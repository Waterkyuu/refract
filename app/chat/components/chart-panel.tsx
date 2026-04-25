"use client";

import { workspaceChartAtom } from "@/atoms/chat";
import { Button } from "@/components/ui/button";
import { useAtomValue } from "jotai";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";

const ChartPanel = memo(() => {
	const chart = useAtomValue(workspaceChartAtom);
	const t = useTranslations("chat");
	const [currentIndex, setCurrentIndex] = useState(0);

	const images = chart?.images ?? [];
	const hasMultipleImages = images.length > 1;
	const currentImage = images[currentIndex];
	const imageSrc = currentImage?.downloadUrl ?? "";

	const handlePrevious = useCallback(() => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
	}, [images.length]);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
	}, [images.length]);

	if (!chart || images.length === 0) {
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
					{currentImage?.downloadUrl && (
						<Button asChild size="sm" variant="outline">
							<a href={currentImage.downloadUrl}>
								<Download className="mr-1 h-3.5 w-3.5" />
								{t("downloadArtifact")}
							</a>
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
					<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
						{t("waitingChart")}
					</div>
				)}
			</div>
			{hasMultipleImages && (
				<div className="flex items-center justify-center gap-3 border-t px-4 py-2">
					<Button
						size="icon"
						variant="ghost"
						onClick={handlePrevious}
						aria-label={t("previousChart")}
						className="h-7 w-7"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-muted-foreground text-xs tabular-nums">
						{currentIndex + 1} / {images.length}
					</span>
					<Button
						size="icon"
						variant="ghost"
						onClick={handleNext}
						aria-label={t("nextChart")}
						className="h-7 w-7"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
});

export default ChartPanel;

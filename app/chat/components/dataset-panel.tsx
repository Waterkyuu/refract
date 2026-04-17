"use client";

import { workspaceDatasetAtom } from "@/atoms/chat";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { memo, useRef } from "react";

const ROW_HEIGHT = 36;

const DatasetPanel = memo(() => {
	const dataset = useAtomValue(workspaceDatasetAtom);
	const t = useTranslations("chat");
	const scrollRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: dataset?.preview.rows.length ?? 0,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 10,
	});

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
			<div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
				<div className="min-w-full text-left text-xs sm:text-sm">
					<div className="sticky top-0 z-10 flex w-full border-b bg-background">
						{preview.columns.map((column) => (
							<div
								key={column}
								className="min-w-0 flex-1 whitespace-nowrap px-3 py-2 font-medium"
							>
								{column}
							</div>
						))}
					</div>
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							position: "relative",
						}}
					>
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const row = preview.rows[virtualRow.index];
							return (
								<div
									key={`${dataset.fileId}-${virtualRow.index}`}
									className="absolute flex w-full border-b"
									style={{
										height: `${virtualRow.size}px`,
										top: `${virtualRow.start}px`,
									}}
								>
									{row.map((cell, cellIndex) => (
										<div
											key={`${dataset.fileId}-${virtualRow.index}-${cellIndex}`}
											className="min-w-0 flex-1 truncate px-3 py-2 text-muted-foreground"
											title={cell}
										>
											{cell}
										</div>
									))}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
});

export default DatasetPanel;

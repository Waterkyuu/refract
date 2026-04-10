"use client";

import { formatFileSize } from "@/lib/file";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { type ReactNode, memo } from "react";

type FileCardProps = {
	action?: ReactNode;
	className?: string;
	extension: string;
	fileName: string;
	fileSize?: number;
	isClickable?: boolean;
	progress?: number;
	subtitle?: string;
};

const FileCard = ({
	action,
	className,
	extension,
	fileName,
	fileSize,
	isClickable = false,
	progress,
	subtitle,
}: FileCardProps) => {
	const sizeLabel =
		typeof fileSize === "number" ? formatFileSize(fileSize) : undefined;
	const detailText =
		subtitle ?? [extension, sizeLabel].filter(Boolean).join(" ");

	return (
		<div
			className={cn(
				"group relative flex w-[16rem] items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-2.5 pr-4 text-left transition-colors duration-200",
				isClickable &&
					"cursor-pointer hover:border-primary/40 hover:bg-primary/5",
				className,
			)}
		>
			<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
				<FileText className="h-5 w-5 text-gray-500" />
			</div>

			<div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left">
				<span className="truncate font-medium text-gray-700 text-xs sm:text-sm">
					{fileName}
				</span>
				{detailText ? (
					<span className="mt-0.5 truncate text-[10px] text-gray-400 sm:text-[11px]">
						{detailText}
						{typeof progress === "number" &&
							` - ${Math.round(progress * 100)}%`}
					</span>
				) : null}
			</div>

			{typeof progress === "number" && (
				<div
					className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300"
					style={{ width: `${progress * 100}%` }}
				/>
			)}

			{action}
		</div>
	);
};

export default memo(FileCard);

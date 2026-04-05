"use client";

import { MonitorSmartphone } from "lucide-react";
import { memo, useEffect } from "react";

import { cn } from "@/lib/utils";

type VncViewerProps = {
	url: string | null;
	className?: string;
	interactive?: boolean;
	onRender?: () => void;
};

const VncViewerBase = ({
	url,
	className,
	interactive = false,
	onRender,
}: VncViewerProps) => {
	useEffect(() => {
		onRender?.();
	}, [onRender, url]);

	if (!url) {
		return (
			<div
				className={cn(
					"flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-slate-300 border-dashed bg-white/80 px-6 text-center",
					className,
				)}
			>
				<div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
					<MonitorSmartphone className="size-5" />
				</div>
				<div className="space-y-1">
					<p className="font-medium text-slate-900">
						Waiting for Agent Sandbox...
					</p>
					<p className="text-slate-500 text-sm">
						The next browser action will attach a live E2B noVNC session here.
					</p>
				</div>
			</div>
		);
	}

	return (
		<iframe
			allow="clipboard-read; clipboard-write"
			className={cn(
				"h-full min-h-[320px] w-full rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-200/60",
				interactive ? "pointer-events-auto" : "pointer-events-none",
				className,
			)}
			src={url}
			title="E2B Agent VNC Stream"
		/>
	);
};

const VncViewer = memo(
	VncViewerBase,
	(previousProps, nextProps) => previousProps.url === nextProps.url,
);

export { VncViewer, type VncViewerProps };

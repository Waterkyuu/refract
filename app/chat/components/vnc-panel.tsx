"use client";

import { vncUrlAtom } from "@/atoms/chat";
import { useAtomValue } from "jotai";
import { Monitor } from "lucide-react";
import { memo, useMemo } from "react";

const VncViewer = memo(
	({ url }: { url: string }) => {
		if (!url) {
			return (
				<div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
					<Monitor className="size-12 opacity-30" />
					<p className="text-sm">Waiting for Agent Sandbox...</p>
				</div>
			);
		}

		return (
			<iframe
				src={url}
				className="h-full w-full border-none"
				title="E2B Agent VNC Stream"
				sandbox="allow-scripts allow-same-origin"
			/>
		);
	},
	(prevProps, nextProps) => prevProps.url === nextProps.url,
);

VncViewer.displayName = "VncViewer";

const VncPanel = () => {
	const vncUrl = useAtomValue(vncUrlAtom);

	const viewerUrl = useMemo(() => vncUrl, [vncUrl]);

	return (
		<div className="flex h-full w-full flex-col bg-muted/30">
			<div className="flex items-center justify-between border-b px-4 py-2">
				<div className="flex items-center gap-2">
					<Monitor className="size-4 text-muted-foreground" />
					<span className="font-medium text-sm">Sandbox Viewer</span>
					{viewerUrl && (
						<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs">
							Live
						</span>
					)}
				</div>
			</div>
			<div className="flex-1 overflow-hidden">
				<VncViewer url={viewerUrl} />
			</div>
		</div>
	);
};

export { VncViewer };
export default memo(VncPanel);

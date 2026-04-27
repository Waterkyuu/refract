import { workspaceTypstContentAtom } from "@/atoms";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { handleError } from "@/lib/error-handler";
import type { WorkerResponse } from "@/types/worker";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

const TypstPreview = () => {
	const [loadingText, setLoadingText] = useState("");
	const [isCompile, setIsCompile] = useState(false);
	const [svgContent, setSvgContent] = useState<string>("");
	const [isWorkerReady, setIsWorkerReady] = useState(false);
	const workerRef = useRef<Worker | null>(null);
	const pendingContentRef = useRef<string>("");
	const typstContent = useAtomValue(workspaceTypstContentAtom);

	useEffect(() => {
		// Initialize worker
		workerRef.current = new Worker(
			new URL("../../../lib/typst-worker.ts", import.meta.url),
			{ type: "module" },
		);

		const worker = workerRef.current;

		// Handle messages from worker
		worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
			const { type } = event.data;

			switch (type) {
				case "init-start":
					setLoadingText(event.data.message);
					break;
				case "init-complete":
					setLoadingText("");
					setIsWorkerReady(true);
					// Compile pending content if any
					if (pendingContentRef.current) {
						worker.postMessage({
							type: "compile",
							content: pendingContentRef.current,
						});
					}
					break;
				case "compile-start":
					setIsCompile(true);
					setSvgContent("");
					break;
				case "compile-complete":
					setSvgContent(event.data.svg);
					setIsCompile(false);
					break;
				case "error":
					handleError(new Error(event.data.error));
					setIsCompile(false);
					setLoadingText("");
					break;
			}
		};

		// Initialize the typst compiler in worker
		worker.postMessage({ type: "init" });

		// Cleanup on unmount
		return () => {
			if (workerRef.current) {
				workerRef.current.postMessage({ type: "terminate" });
				workerRef.current.terminate();
				workerRef.current = null;
			}
		};
	}, []);

	// Compile content when it changes
	useEffect(() => {
		if (!workerRef.current) return;

		if (isWorkerReady) {
			workerRef.current.postMessage({
				type: "compile",
				content: typstContent,
			});
		} else {
			// Store content to compile after worker is ready
			pendingContentRef.current = typstContent;
		}
	}, [typstContent, isWorkerReady]);

	return (
		<ScrollArea className="h-full w-full p-6">
			<article className="max-w-none">
				{loadingText && (
					<div className="flex items-center justify-center py-12">
						<p className="text-muted-foreground">{loadingText}</p>
					</div>
				)}
				{isCompile && (
					<div className="flex items-center justify-center py-12">
						<Spinner className="size-3 md:size-4" />
					</div>
				)}
				{svgContent && (
					<div
						className="w-full shadow-lg [&>svg]:h-auto [&>svg]:w-full"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: content is sanitized by mermaid library
						dangerouslySetInnerHTML={{ __html: svgContent }}
					/>
				)}
			</article>
		</ScrollArea>
	);
};

export default TypstPreview;

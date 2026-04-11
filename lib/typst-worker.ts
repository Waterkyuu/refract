import type { WorkerMessage, WorkerResponse } from "@/types/worker";

let isInitialized = false;
let $typst:
	| Awaited<typeof import("@myriaddreamin/typst.ts/contrib/snippet")>["$typst"]
	| null = null;

const initTypstCompiler = async () => {
	try {
		postMessage({
			type: "init-start",
			message: "Loading wasm...",
		} as WorkerResponse);

		const typstModule = await import("@myriaddreamin/typst.ts/contrib/snippet");
		$typst = typstModule.$typst;

		$typst.setCompilerInitOptions({
			getModule: () => "/typst_ts_web_compiler_bg.wasm",
		});

		$typst.setRendererInitOptions({
			getModule: () => "/typst_ts_renderer_bg.wasm",
		});

		postMessage({
			type: "init-start",
			message: "The compiler is being initialized",
		} as WorkerResponse);

		isInitialized = true;
		postMessage({ type: "init-complete" } as WorkerResponse);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		postMessage({ type: "error", error: errorMessage } as WorkerResponse);
	}
};

const compileSvg = async (content: string) => {
	try {
		if (!isInitialized) {
			throw new Error("Compiler not initialized");
		}

		if (!$typst) {
			throw new Error("Compiler not initialized");
		}

		postMessage({ type: "compile-start" } as WorkerResponse);

		const svgString = await $typst.svg({
			mainContent: content,
		});

		if (!svgString) {
			throw new Error("Failed to compile typst content");
		}

		postMessage({ type: "compile-complete", svg: svgString } as WorkerResponse);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		postMessage({ type: "error", error: errorMessage } as WorkerResponse);
	}
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
	const { type } = event.data;

	switch (type) {
		case "init":
			await initTypstCompiler();
			break;
		case "compile":
			await compileSvg(event.data.content);
			break;
		case "terminate":
			self.close();
			break;
		default:
			postMessage({
				type: "error",
				error: `Unknown message type: ${type}`,
			} as WorkerResponse);
	}
};

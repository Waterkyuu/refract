import { basename } from "node:path/posix";
import { formatSandboxOperationError } from "@/lib/agent/utils/error-utils";
import { Sandbox as CodeSandbox } from "@e2b/code-interpreter";
import { Sandbox as DesktopSandbox } from "@e2b/desktop";
import {
	getUploadedFileBytes,
	storeFileRecordFromBytes,
} from "../../file-store";

const E2B_API_KEY = process.env.E2B_API_KEY;

if (!E2B_API_KEY) {
	console.warn(
		"[E2B] E2B_API_KEY is not set. Sandbox creation will fail. Set it in .env.local",
	);
}

const SANDBOX_TIMEOUT_MS = 5 * 60 * 1000;
const CODE_DATA_DIR = "/home/user/data";
const CODE_OUTPUT_DIR = "/home/user/output";

type ManagedDesktopSandbox = {
	sandbox: DesktopSandbox;
	sandboxId: string;
	vncUrl: string;
	createdAt: number;
	timeoutHandle: ReturnType<typeof setTimeout> | null;
};

type ManagedCodeSandbox = {
	sandbox: CodeSandbox;
	sandboxId: string;
	createdAt: number;
	lastChartArtifact?: {
		png: string;
		title?: string;
	};
	syncedFileIds: Set<string>;
	timeoutHandle: ReturnType<typeof setTimeout> | null;
};

type CodeExecutionResult = {
	text?: string;
	results: Array<{
		chart?: Record<string, unknown>;
		data?: Record<string, unknown>;
		jpeg?: string;
		json?: string;
		latex?: string;
		markdown?: string;
		pdf?: string;
		svg?: string;
		text?: string;
		html?: string;
		png?: string;
	}>;
	stdout: string[];
	stderr: string[];
	error?: { name: string; value: string; traceback: string };
};

type PersistedFileInput = {
	contentType?: string;
	filename?: string;
	filePath: string;
	kind?: "dataset" | "document";
};

type PersistedChartInput = {
	contentType?: string;
	filename?: string;
};

type SandboxSession = {
	id: string;
	createDesktopSandbox: (
		opts?: Record<string, unknown>,
	) => Promise<{ sandboxId: string; vncUrl: string }>;
	executeCommand: (
		command: string,
	) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
	navigateBrowser: (url: string) => Promise<{ url: string; title: string }>;
	searchWeb: (query: string) => Promise<{
		query: string;
		results: Array<{ title: string; snippet: string }>;
	}>;
	executeCode: (
		code: string,
		fileIds?: string[],
	) => Promise<CodeExecutionResult>;
	persistCodeFile: (
		input: PersistedFileInput,
	) => Promise<Awaited<ReturnType<typeof storeFileRecordFromBytes>>>;
	persistLatestChart: (
		input?: PersistedChartInput,
	) => Promise<Awaited<ReturnType<typeof storeFileRecordFromBytes>>>;
	cleanup: () => Promise<void>;
};

const clearTimer = (timeoutHandle: ReturnType<typeof setTimeout> | null) => {
	if (timeoutHandle) {
		clearTimeout(timeoutHandle);
	}
};

const killDesktopSandbox = async (entry: ManagedDesktopSandbox | undefined) => {
	if (!entry) {
		return;
	}

	clearTimer(entry.timeoutHandle);
	entry.timeoutHandle = null;

	try {
		await entry.sandbox.kill();
	} catch {
		// sandbox may already be dead
	}
};

const killCodeSandbox = async (entry: ManagedCodeSandbox | undefined) => {
	if (!entry) {
		return;
	}

	clearTimer(entry.timeoutHandle);
	entry.timeoutHandle = null;

	try {
		await entry.sandbox.kill();
	} catch {
		// sandbox may already be dead
	}
};

const createManagedDesktopSandbox = async (
	opts?: Record<string, unknown>,
): Promise<ManagedDesktopSandbox> => {
	const sandbox = await DesktopSandbox.create({
		apiKey: E2B_API_KEY,
		resolution: [1024, 720],
		dpi: 96,
		timeoutMs: SANDBOX_TIMEOUT_MS,
		...(opts || {}),
	});

	await sandbox.stream.start({ requireAuth: true });
	const authKey = sandbox.stream.getAuthKey();

	return {
		sandbox,
		sandboxId: sandbox.sandboxId,
		vncUrl: sandbox.stream.getUrl({
			authKey,
			autoConnect: true,
			resize: "remote",
		}),
		createdAt: Date.now(),
		timeoutHandle: null,
	};
};

const createManagedCodeSandbox = async (
	opts?: Record<string, unknown>,
): Promise<ManagedCodeSandbox> => {
	const sandbox = await CodeSandbox.create({
		apiKey: E2B_API_KEY,
		timeoutMs: SANDBOX_TIMEOUT_MS,
		...(opts || {}),
	});

	return {
		sandbox,
		sandboxId: sandbox.sandboxId,
		createdAt: Date.now(),
		lastChartArtifact: undefined,
		syncedFileIds: new Set<string>(),
		timeoutHandle: null,
	};
};

const createSandboxSession = (): SandboxSession => {
	const id = crypto.randomUUID();
	let desktopEntry: ManagedDesktopSandbox | undefined;
	let codeEntry: ManagedCodeSandbox | undefined;

	const scheduleDesktopCleanup = (entry: ManagedDesktopSandbox) => {
		clearTimer(entry.timeoutHandle);
		entry.timeoutHandle = setTimeout(async () => {
			if (desktopEntry?.sandboxId === entry.sandboxId) {
				await killDesktopSandbox(entry);
				desktopEntry = undefined;
			}
		}, SANDBOX_TIMEOUT_MS);
	};

	const scheduleCodeCleanup = (entry: ManagedCodeSandbox) => {
		clearTimer(entry.timeoutHandle);
		entry.timeoutHandle = setTimeout(async () => {
			if (codeEntry?.sandboxId === entry.sandboxId) {
				await killCodeSandbox(entry);
				codeEntry = undefined;
			}
		}, SANDBOX_TIMEOUT_MS);
	};

	const ensureDesktopSandbox = async (opts?: Record<string, unknown>) => {
		if (!desktopEntry) {
			desktopEntry = await createManagedDesktopSandbox(opts);
		}

		scheduleDesktopCleanup(desktopEntry);
		return desktopEntry;
	};

	const ensureCodeSandbox = async (opts?: Record<string, unknown>) => {
		if (!codeEntry) {
			codeEntry = await createManagedCodeSandbox(opts);
		}

		scheduleCodeCleanup(codeEntry);
		return codeEntry;
	};

	const ensureCodeDirectories = async (entry: ManagedCodeSandbox) => {
		try {
			await Promise.all([
				entry.sandbox.files.makeDir(CODE_DATA_DIR),
				entry.sandbox.files.makeDir(CODE_OUTPUT_DIR),
			]);
		} catch (error) {
			throw new Error(
				formatSandboxOperationError("prepare code sandbox directories", error),
			);
		}
	};

	const syncFilesToCodeSandbox = async (fileIds: string[]) => {
		if (fileIds.length === 0) {
			return;
		}

		const entry = await ensureCodeSandbox();
		await ensureCodeDirectories(entry);

		for (const fileId of fileIds) {
			if (entry.syncedFileIds.has(fileId)) {
				continue;
			}

			try {
				const { bytes, record } = await getUploadedFileBytes(fileId);
				const fileBuffer = new ArrayBuffer(bytes.byteLength);
				new Uint8Array(fileBuffer).set(bytes);
				await entry.sandbox.files.write(
					`${CODE_DATA_DIR}/${record.filename}`,
					fileBuffer,
				);
				entry.syncedFileIds.add(fileId);
			} catch (error) {
				throw new Error(
					formatSandboxOperationError(`sync uploaded file "${fileId}"`, error),
				);
			}
		}
	};

	return {
		id,
		createDesktopSandbox: async (opts?: Record<string, unknown>) => {
			const entry = await ensureDesktopSandbox(opts);

			return {
				sandboxId: entry.sandboxId,
				vncUrl: entry.vncUrl,
			};
		},
		executeCommand: async (command: string) => {
			const entry = await ensureDesktopSandbox();
			const result = await entry.sandbox.commands.run(command);

			return {
				stdout: result.stdout,
				stderr: result.stderr,
				exitCode: result.exitCode,
			};
		},
		navigateBrowser: async (url: string) => {
			const entry = await ensureDesktopSandbox();
			await entry.sandbox.open(url);
			await entry.sandbox.wait(3000);

			return { url, title: `Navigated to ${url}` };
		},
		searchWeb: async (query: string) => {
			const entry = await ensureDesktopSandbox();
			const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

			await entry.sandbox.launch("google-chrome", searchUrl);
			await entry.sandbox.wait(5000);

			const screenshot = await entry.sandbox.screenshot("bytes");

			return {
				query,
				results: [
					{
						title: `Searched for: ${query}`,
						snippet: `Browser opened at ${searchUrl}. Screenshot captured (${screenshot.byteLength} bytes). View the VNC stream for visual results.`,
					},
				],
			};
		},
		executeCode: async (
			code: string,
			fileIds: string[] = [],
		): Promise<CodeExecutionResult> => {
			const entry = await ensureCodeSandbox();
			await ensureCodeDirectories(entry);
			await syncFilesToCodeSandbox(fileIds);

			let execution: Awaited<ReturnType<CodeSandbox["runCode"]>>;
			try {
				execution = await entry.sandbox.runCode(code);
			} catch (error) {
				throw new Error(formatSandboxOperationError("run Python code", error));
			}
			const latestChartResult = execution.results.find((result) => result.png);

			entry.lastChartArtifact = latestChartResult?.png
				? {
						png: latestChartResult.png,
						title:
							typeof latestChartResult.chart?.title === "string"
								? latestChartResult.chart.title
								: latestChartResult.text,
					}
				: entry.lastChartArtifact;

			return {
				text: execution.text,
				results: execution.results.map((result) => ({
					chart: result.chart as Record<string, unknown> | undefined,
					data: result.data,
					text: result.text,
					html: result.html,
					jpeg: result.jpeg,
					json: result.json,
					latex: result.latex,
					markdown: result.markdown,
					pdf: result.pdf,
					png: result.png,
					svg: result.svg,
				})),
				stdout: execution.logs.stdout,
				stderr: execution.logs.stderr,
				error: execution.error
					? {
							name: execution.error.name,
							value: execution.error.value,
							traceback: execution.error.traceback,
						}
					: undefined,
			};
		},
		persistCodeFile: async ({
			contentType,
			filename,
			filePath,
			kind,
		}: PersistedFileInput) => {
			const entry = await ensureCodeSandbox();
			const fileBytes = (await entry.sandbox.files.read(filePath, {
				format: "bytes",
			})) as Uint8Array;

			return storeFileRecordFromBytes({
				bytes: fileBytes,
				contentType,
				filename: filename ?? basename(filePath),
				kind,
			});
		},
		persistLatestChart: async ({
			contentType = "image/png",
			filename = "chart.png",
		}: PersistedChartInput = {}) => {
			const entry = await ensureCodeSandbox();
			if (!entry.lastChartArtifact?.png) {
				throw new Error("No chart artifact available. Generate a chart first.");
			}

			return storeFileRecordFromBytes({
				bytes: Buffer.from(entry.lastChartArtifact.png, "base64"),
				contentType,
				filename,
				kind: "document",
			});
		},
		cleanup: async () => {
			await killDesktopSandbox(desktopEntry);
			await killCodeSandbox(codeEntry);
			desktopEntry = undefined;
			codeEntry = undefined;
		},
	};
};

export { CODE_DATA_DIR, CODE_OUTPUT_DIR, createSandboxSession };
export type { SandboxSession, CodeExecutionResult };

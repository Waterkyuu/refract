import jotaiStore from "@/atoms";
import {
	agentStatusAtom,
	clearToolEventsAtom,
	dispatchToolEventAtom,
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
} from "@/atoms/chat";
import loginDialogAtom from "@/atoms/login-dialog";
import {
	resetPipelineAtom,
	setPipelinePlanAtom,
	updatePipelineStepAtom,
} from "@/atoms/pipeline";
import type { PipelineStreamEvent } from "@/lib/agent/agents/types";
import type { ChatMessageMetadata, ToolCallEvent } from "@/types/chat";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
	startTransition,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

type UsePipelineChatOptions = {
	api?: string;
	sessionId?: string;
	onFinish?: (messages: UIMessage[]) => void;
	onError?: (error: Error) => void;
	initialMessages?: UIMessage[];
};

type UsePipelineChatReturn = {
	input: string;
	setInput: (input: string) => void;
	messages: UIMessage[];
	setMessages: (messages: UIMessage[]) => void;
	status: ChatStatus;
	isLoading: boolean;
	error: Error | undefined;
	thinkingTime: number | null;
	append: (
		text: string,
		options?: {
			body?: Record<string, unknown>;
			metadata?: ChatMessageMetadata;
		},
	) => Promise<void>;
	reload: () => Promise<void>;
	stop: () => void;
};

const STREAM_RENDER_THROTTLE_MS = 80;

const createAuthAwareChatFetch = (
	fetchImpl: typeof fetch = fetch,
): typeof fetch => {
	return async (input, init) => {
		const response = await fetchImpl(input, init);

		if (response.status === 401 && typeof window !== "undefined") {
			jotaiStore.set(loginDialogAtom, true);
		}

		return response;
	};
};

const extractToolEventsFromMessages = (
	messages: UIMessage[],
	existingMap: Map<string, ToolCallEvent>,
): ToolCallEvent[] => {
	const events: ToolCallEvent[] = [];

	for (const msg of messages) {
		if (msg.role !== "assistant") continue;
		for (const part of msg.parts) {
			if (typeof part.type !== "string" || !part.type.startsWith("tool-"))
				continue;

			const partRecord = part as Record<string, unknown>;
			const toolCallId = partRecord.toolCallId as string | undefined;
			if (!toolCallId) continue;

			const toolName = part.type.slice(5);
			const partState = partRecord.state as string | undefined;
			const partInput = partRecord.input;
			const partOutput = partRecord.output;
			const partErrorText = partRecord.errorText;

			const prev = existingMap.get(toolCallId);
			const startedAt = prev?.startedAt ?? Date.now();

			const state: ToolCallEvent["state"] =
				partState === "input-streaming"
					? "partial-call"
					: partState === "input-available"
						? "call"
						: partState === "output-available" || partState === "output-error"
							? "result"
							: "call";

			const finishedAt =
				partState === "output-available" || partState === "output-error"
					? Date.now()
					: prev?.finishedAt;

			const durationMs = finishedAt ? finishedAt - startedAt : prev?.durationMs;

			const event: ToolCallEvent = {
				id: prev?.id ?? crypto.randomUUID(),
				toolCallId,
				toolName,
				args: (partInput as Record<string, unknown>) ?? {},
				state,
				result:
					partState === "output-error" ? { error: partErrorText } : partOutput,
				startedAt,
				finishedAt,
				durationMs,
			};

			events.push(event);

			if (
				toolName === "createSandbox" &&
				partState === "output-available" &&
				partOutput
			) {
				const output = partOutput as { vncUrl?: string };
				if (output.vncUrl) {
					jotaiStore.set(vncUrlAtom, output.vncUrl);
				}
			}

			if (
				toolName === "codeInterpreter" &&
				partState === "output-available" &&
				partOutput
			) {
				const output = partOutput as {
					results?: Array<{
						chart?: Record<string, unknown>;
						png?: string;
						text?: string;
					}>;
				};
				const chartResult = output.results?.find(
					(result) => result.chart || result.png,
				);

				if (chartResult) {
					jotaiStore.set(showChartWorkspaceAtom, {
						chart: chartResult.chart,
						generatedAt: Date.now(),
						png: chartResult.png,
						title:
							typeof chartResult.chart?.title === "string"
								? chartResult.chart.title
								: chartResult.text,
						toolCallId,
					});
				}
			}

			if (
				toolName === "persistCodeFile" &&
				partState === "output-available" &&
				partOutput
			) {
				const output = partOutput as {
					fileId?: string;
					filename?: string;
					kind?: string;
					preview?: {
						activeSheet: string;
						columns: string[];
						rows: string[][];
						sheetNames: string[];
						totalColumns: number;
						totalRows: number;
					};
				};

				if (
					output.kind === "dataset" &&
					output.fileId &&
					output.filename &&
					output.preview
				) {
					jotaiStore.set(showDatasetWorkspaceAtom, {
						fileId: output.fileId,
						filename: output.filename,
						preview: output.preview,
					});
				}
			}

			if (
				toolName === "persistLatestChart" &&
				partState === "output-available" &&
				partOutput
			) {
				const output = partOutput as {
					downloadUrl?: string;
					fileId?: string;
					filename?: string;
				};
				const currentChart = jotaiStore.get(workspaceChartAtom);

				if (currentChart && output.downloadUrl) {
					jotaiStore.set(showChartWorkspaceAtom, {
						...currentChart,
						downloadUrl: output.downloadUrl,
						fileId: output.fileId,
						filename: output.filename,
					});
				}
			}
		}
	}

	return events;
};

const STEP_LABELS: Record<string, string> = {
	data: "Data Cleaning",
	chart: "Chart Generation",
	report: "Report Writing",
};

const usePipelineChat = (
	options: UsePipelineChatOptions = {},
): UsePipelineChatReturn => {
	const {
		api = "/api/chat",
		sessionId,
		onFinish,
		onError,
		initialMessages = [],
	} = options;

	const [input, setInput] = useState("");
	const [thinkingTime, setThinkingTime] = useState<number | null>(null);
	const [renderedMessages, setRenderedMessages] =
		useState<UIMessage[]>(initialMessages);
	const [pipelineMessages, setPipelineMessages] = useState<UIMessage[]>([]);
	const [pipelineStatus, setPipelineStatus] = useState<ChatStatus>("ready");
	const [pipelineError, setPipelineError] = useState<Error | undefined>();
	const reasoningStartTimeRef = useRef<number | null>(null);
	const processedToolCallsRef = useRef(new Map<string, ToolCallEvent>());
	const transportApiRef = useRef(api);
	const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
	const renderFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const abortRef = useRef<AbortController | null>(null);

	if (!transportRef.current || transportApiRef.current !== api) {
		transportRef.current = new DefaultChatTransport({
			api,
			fetch: createAuthAwareChatFetch(),
		});
		transportApiRef.current = api;
	}

	const chat = useChat({
		id: sessionId,
		messages: initialMessages,
		transport: transportRef.current,
	});

	const rawMessages = chat.messages;
	const status = chat.status;

	useEffect(() => {
		if (!sessionId || initialMessages.length === 0 || rawMessages.length > 0) {
			return;
		}

		chat.setMessages(initialMessages);
	}, [chat, initialMessages, rawMessages.length, sessionId]);

	useEffect(() => {
		const flushRenderedMessages = (nextMessages: UIMessage[]) => {
			startTransition(() => {
				setRenderedMessages(nextMessages);
			});
		};

		const clearPendingFlush = () => {
			if (renderFlushTimeoutRef.current) {
				clearTimeout(renderFlushTimeoutRef.current);
				renderFlushTimeoutRef.current = null;
			}
		};

		const lastMessage = rawMessages.at(-1);
		const shouldFlushImmediately =
			status !== "streaming" ||
			lastMessage?.role !== "assistant" ||
			rawMessages.length <= 1;

		if (shouldFlushImmediately) {
			clearPendingFlush();
			flushRenderedMessages(rawMessages);
			return;
		}

		clearPendingFlush();
		renderFlushTimeoutRef.current = setTimeout(() => {
			flushRenderedMessages(rawMessages);
			renderFlushTimeoutRef.current = null;
		}, STREAM_RENDER_THROTTLE_MS);

		return clearPendingFlush;
	}, [rawMessages, status]);

	useEffect(() => {
		for (const msg of rawMessages) {
			if (msg.role !== "assistant") continue;
			for (const part of msg.parts) {
				if (
					part.type === "reasoning" &&
					reasoningStartTimeRef.current === null
				) {
					reasoningStartTimeRef.current = Date.now();
					jotaiStore.set(agentStatusAtom, "thinking");
				}
				if (part.type === "text" && reasoningStartTimeRef.current !== null) {
					const elapsed = (Date.now() - reasoningStartTimeRef.current) / 1000;
					setThinkingTime(elapsed);
					reasoningStartTimeRef.current = null;
					jotaiStore.set(agentStatusAtom, "acting");
				}
			}
		}
	}, [rawMessages]);

	useEffect(() => {
		const events = extractToolEventsFromMessages(
			rawMessages,
			processedToolCallsRef.current,
		);
		for (const event of events) {
			processedToolCallsRef.current.set(event.toolCallId, event);
			jotaiStore.set(dispatchToolEventAtom, event);
		}
	}, [rawMessages]);

	useEffect(() => {
		if (status === "ready" && rawMessages.length > 0) {
			reasoningStartTimeRef.current = null;
			onFinish?.(rawMessages);
		}
	}, [status, rawMessages, onFinish]);

	useEffect(() => {
		if (status === "error" && chat.error) {
			onError?.(chat.error);
		}
	}, [status, chat.error, onError]);

	const allMessages =
		pipelineMessages.length > 0 ? pipelineMessages : renderedMessages;
	const combinedStatus: ChatStatus =
		pipelineStatus !== "ready" ? pipelineStatus : (status as ChatStatus);
	const combinedError = pipelineError ?? chat.error;
	const combinedLoading =
		status === "submitted" ||
		status === "streaming" ||
		pipelineStatus === "submitted" ||
		pipelineStatus === "streaming";

	const processPipelineStream = async (
		response: Response,
		userMessage: UIMessage,
	) => {
		const reader = response.body?.getReader();
		if (!reader) return;

		const decoder = new TextDecoder();
		let buffer = "";
		const assistantParts: Array<{ type: string; text: string }> = [];

		setPipelineStatus("streaming");
		jotaiStore.set(agentStatusAtom, "thinking");

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith("data: ")) continue;

					const jsonStr = trimmed.slice(6);
					let parsed: { type: string; event?: PipelineStreamEvent };

					try {
						parsed = JSON.parse(jsonStr);
					} catch {
						continue;
					}

					if (parsed.type !== "pipeline-event" || !parsed.event) continue;

					const evt = parsed.event as PipelineStreamEvent;

					switch (evt.type) {
						case "plan": {
							jotaiStore.set(setPipelinePlanAtom, evt.plan);
							break;
						}
						case "step-start": {
							jotaiStore.set(updatePipelineStepAtom, {
								step: evt.step,
								status: "running",
							});

							assistantParts.push({
								type: "text",
								text: `\n--- **[${STEP_LABELS[evt.step] ?? evt.step} Agent]** ---\n\n`,
							});
							break;
						}
						case "step-delta": {
							const lastPart = assistantParts[assistantParts.length - 1];
							if (lastPart && lastPart.type === "text") {
								lastPart.text += evt.content;
							}
							break;
						}
						case "step-complete": {
							jotaiStore.set(updatePipelineStepAtom, {
								step: evt.step,
								status: "completed",
							});
							break;
						}
						case "step-error": {
							jotaiStore.set(updatePipelineStepAtom, {
								step: evt.step,
								status: "error",
							});
							assistantParts.push({
								type: "text",
								text: `\n> Error in ${STEP_LABELS[evt.step] ?? evt.step}: ${evt.error}\n`,
							});
							break;
						}
						case "pipeline-complete": {
							break;
						}
					}

					const assistantMessage: UIMessage = {
						id: `pipeline-${Date.now()}`,
						role: "assistant",
						parts: assistantParts.map((p) => ({
							type: "text" as const,
							text: p.text,
						})),
					};

					setPipelineMessages([userMessage, assistantMessage]);
				}
			}
		} finally {
			reader.releaseLock();
			setPipelineStatus("ready");
			jotaiStore.set(agentStatusAtom, "completed");

			if (assistantParts.length > 0) {
				const finalMessage: UIMessage = {
					id: `pipeline-${Date.now()}`,
					role: "assistant",
					parts: assistantParts.map((p) => ({
						type: "text" as const,
						text: p.text,
					})),
				};
				setPipelineMessages([userMessage, finalMessage]);
				onFinish?.([userMessage, finalMessage]);
			}
		}
	};

	const append = useCallback(
		async (
			text: string,
			opts?: {
				body?: Record<string, unknown>;
				metadata?: ChatMessageMetadata;
			},
		) => {
			setThinkingTime(null);
			reasoningStartTimeRef.current = null;
			processedToolCallsRef.current.clear();
			jotaiStore.set(clearToolEventsAtom);
			jotaiStore.set(resetPipelineAtom);
			jotaiStore.set(agentStatusAtom, "thinking");
			setPipelineMessages([]);
			setPipelineError(undefined);

			const userMessage: UIMessage = {
				id: crypto.randomUUID(),
				role: "user",
				parts: [{ type: "text", text }],
			};

			const fileIds = (opts?.body?.fileIds as string[]) ?? [];

			try {
				abortRef.current = new AbortController();
				const response = await fetch(api, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fileIds,
						messages: [
							{
								role: "user",
								content: text,
								parts: [{ type: "text", text }],
							},
						],
						mode: "pipeline",
					}),
					signal: abortRef.current.signal,
				});

				if (response.ok && response.body) {
					await processPipelineStream(response, userMessage);
					return;
				}
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") return;
				console.warn(
					"[Pipeline] Pipeline mode failed, falling back to single mode:",
					err,
				);
			}

			jotaiStore.set(agentStatusAtom, "thinking");
			setPipelineMessages([]);

			await chat.sendMessage(
				{ metadata: opts?.metadata, text },
				{ body: opts?.body },
			);
		},
		[chat, api],
	);

	const reload = useCallback(async () => {
		setThinkingTime(null);
		reasoningStartTimeRef.current = null;
		jotaiStore.set(agentStatusAtom, "thinking");
		await chat.regenerate();
	}, [chat]);

	const stop = useCallback(() => {
		chat.stop();
		abortRef.current?.abort();
		setPipelineStatus("ready");
		jotaiStore.set(agentStatusAtom, "idle");
	}, [chat]);

	return {
		input,
		setInput,
		messages: allMessages,
		setMessages: (msgs: UIMessage[]) => chat.setMessages(msgs),
		status: combinedStatus,
		isLoading: combinedLoading,
		error: combinedError,
		thinkingTime,
		append,
		reload,
		stop,
	};
};

export type { UsePipelineChatReturn, ChatStatus };
export { createAuthAwareChatFetch, extractToolEventsFromMessages };
export default usePipelineChat;

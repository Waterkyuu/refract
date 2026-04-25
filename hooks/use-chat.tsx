import jotaiStore from "@/atoms";
import {
	agentStatusAtom,
	clearToolEventsAtom,
	dispatchToolEventAtom,
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	showVncWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
} from "@/atoms/chat";
import loginDialogAtom from "@/atoms/login-dialog";
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

type UseChatOptions = {
	api?: string;
	sessionId?: string;
	onFinish?: (messages: UIMessage[]) => void;
	onError?: (error: Error) => void;
	initialMessages?: UIMessage[];
};

type UseChatReturn = {
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
					jotaiStore.set(showVncWorkspaceAtom);
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
						generatedAt: Date.now(),
						images: [],
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
					downloadUrl?: string;
					fileId?: string;
					filename?: string;
					kind?: string;
				};

				if (output.kind === "dataset" && output.fileId && output.filename) {
					jotaiStore.set(showDatasetWorkspaceAtom, {
						downloadUrl: output.downloadUrl,
						fileId: output.fileId,
						filename: output.filename,
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
						images: [
							{
								downloadUrl: output.downloadUrl,
								fileId: output.fileId,
								filename: output.filename,
							},
						],
					});
				}
			}
		}
	}

	return events;
};

export type { UseChatReturn, ChatStatus };
export { createAuthAwareChatFetch, extractToolEventsFromMessages };

const useAgentChat = (options: UseChatOptions = {}): UseChatReturn => {
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
	const reasoningStartTimeRef = useRef<number | null>(null);
	const processedToolCallsRef = useRef(new Map<string, ToolCallEvent>());
	const transportApiRef = useRef(api);
	const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
	const renderFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

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

		// Restore persisted history after the session is created before IndexedDB
		// finishes loading, without overwriting an active in-memory conversation.
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
			jotaiStore.set(agentStatusAtom, "thinking");

			await chat.sendMessage(
				{ metadata: opts?.metadata, text },
				{ body: opts?.body },
			);
		},
		[chat],
	);

	const reload = useCallback(async () => {
		setThinkingTime(null);
		reasoningStartTimeRef.current = null;
		jotaiStore.set(agentStatusAtom, "thinking");
		await chat.regenerate();
	}, [chat]);

	const stop = useCallback(() => {
		chat.stop();
		jotaiStore.set(agentStatusAtom, "idle");
	}, [chat]);

	return {
		input,
		setInput,
		messages: renderedMessages,
		setMessages: (msgs: UIMessage[]) => chat.setMessages(msgs),
		status: status as ChatStatus,
		isLoading: status === "submitted" || status === "streaming",
		error: chat.error,
		thinkingTime,
		append,
		reload,
		stop,
	};
};

export default useAgentChat;

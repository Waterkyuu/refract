import type { MessageItem, Messages, Role, ToolCall } from "@/types/chat";
import { useCallback, useEffect, useRef, useState } from "react";

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

// SSE message types aligned with Eino framework schema.Message
type SSEMessage = {
	role: Role;
	content?: string | null;
	reasoning_content?: string;
	tool_calls?: ToolCall[];
	tool_call_id?: string;
	tool_name?: string;
};

export type UseChatOptions = {
	/** The API endpoint URL for streaming chat requests */
	api?: string;
	/** Custom request body for the chat API */
	body?: Record<string, unknown>;
	/** Callback invoked when the chat stream completes */
	onFinish?: (message: MessageItem, messages: Messages) => void;
	/** Callback invoked when an error occurs during streaming */
	onError?: (error: Error) => void;
	/** Initial messages to populate the chat */
	initialMessages?: Messages;
	/** Maximum number of messages to keep in history */
	maxMessages?: number;
};

export type AppendOptions = {
	requestBody?: Record<string, unknown>;
};

export type UseChatReturn = {
	/** Current user input value */
	input: string;
	/** Function to update the input value */
	setInput: (input: string) => void;
	/** Current chat messages */
	messages: Messages;
	/** Function to set all messages */
	setMessages: (messages: Messages) => void;
	/** Current chat status */
	status: ChatStatus;
	/** Whether the chat is currently loading/streaming */
	isLoading: boolean;
	/** Error object if an error occurred */
	error: Error | null;
	/** Thinking time in milliseconds (time from request start to first reasoning_content) */
	thinkingTime: number | null;
	/** Function to append a user message and get a response */
	append: (
		message: Pick<MessageItem, "content" | "role">,
		options?: AppendOptions,
	) => Promise<void>;
	/** Function to reload the last assistant response */
	reload: () => Promise<void>;
	/** Function to stop ongoing streaming request */
	stop: () => void;
};

/**
 * Parse SSE data line and return structured message
 */
const parseSSELine = (line: string): SSEMessage | null => {
	if (!line.startsWith("data: ")) return null;

	const data = line.slice(6).trim();
	if (data === "[DONE]") return null;

	try {
		return JSON.parse(data) as SSEMessage;
	} catch {
		return null;
	}
};

/**
 * Process SSE stream and handle different message types
 * reasoning_content and content are separated into different messages
 */
const processSSEStream = async (
	response: Response,
	currentMessages: MessageItem[],
	onUpdate: (messages: Messages) => void,
	onReasoningStart?: () => void,
	onReasoningEnd?: () => void,
): Promise<Messages> => {
	const reader = response.body?.getReader();
	if (!reader) throw new Error("No response body reader available");

	const decoder = new TextDecoder();
	let buffer = "";
	const messages = [...currentMessages];

	// Track current streaming messages
	let currentReasoningMessage: MessageItem | null = null;
	let currentContentMessage: MessageItem | null = null;
	let reasoningMessageIndex = -1;
	let contentMessageIndex = -1;
	let hasReasoningStarted = false;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });

		const lines = buffer.split("\n\n");

		buffer = lines.pop() || ""; // Keep incomplete line in buffer

		for (const line of lines) {
			const msg = parseSSELine(line);
			if (!msg) continue;

			// Handle tool_calls message (complete object, not accumulated)
			if (
				msg.role === "assistant" &&
				msg.tool_calls &&
				msg.tool_calls.length > 0
			) {
				const toolCallsMessage: MessageItem = {
					role: "assistant",
					content: null,
					tool_calls: msg.tool_calls,
				};
				messages.push(toolCallsMessage);
				onUpdate(messages);

				// Reset streaming message trackers
				currentReasoningMessage = null;
				currentContentMessage = null;
				reasoningMessageIndex = -1;
				contentMessageIndex = -1;
				continue;
			}

			// Handle tool result message (complete object, not accumulated)
			if (msg.role === "tool") {
				const toolMessage: MessageItem = {
					role: "tool",
					content: msg.content || "",
					tool_call_id: msg.tool_call_id,
					tool_name: msg.tool_name,
				};
				messages.push(toolMessage);
				onUpdate(messages);

				// Reset streaming message trackers
				currentReasoningMessage = null;
				currentContentMessage = null;
				reasoningMessageIndex = -1;
				contentMessageIndex = -1;
				continue;
			}

			// Handle assistant with reasoning_content (streaming, separate message)
			if (msg.role === "assistant" && msg.reasoning_content) {
				if (!currentReasoningMessage) {
					currentReasoningMessage = {
						role: "assistant",
						reasoning_content: "",
					};
					messages.push(currentReasoningMessage);
					reasoningMessageIndex = messages.length - 1;

					// Notify when reasoning starts (first reasoning_content received)
					if (!hasReasoningStarted) {
						hasReasoningStarted = true;
						onReasoningStart?.();
					}
				}

				if (currentReasoningMessage) {
					currentReasoningMessage.reasoning_content += msg.reasoning_content;
					messages[reasoningMessageIndex] = currentReasoningMessage;
					onUpdate(messages);
				}
			}

			// Handle assistant with content (streaming, separate message)
			if (msg.role === "assistant" && msg.content) {
				if (!currentContentMessage) {
					currentContentMessage = {
						role: "assistant",
						content: "",
					};
					messages.push(currentContentMessage);
					contentMessageIndex = messages.length - 1;

					// Notify when reasoning ends (first content received)
					if (hasReasoningStarted) {
						onReasoningEnd?.();
					}
				}

				if (currentContentMessage) {
					currentContentMessage.content += msg.content;
					messages[contentMessageIndex] = currentContentMessage;
					onUpdate(messages);
				}
			}
		}
	}

	return messages;
};

/**
 * A custom hook for managing streaming chat conversations.
 * Supports tool calls, reasoning content, and delta streaming.
 * reasoning_content and content are separated into different messages.
 */
export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
	const {
		api = "http://localhost:3000/api/v1/gen/text",
		body,
		onFinish,
		onError,
		initialMessages = [],
		maxMessages = 50,
	} = options;

	// State management
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Messages>(initialMessages);
	const [status, setStatus] = useState<ChatStatus>("ready");
	const [error, setError] = useState<Error | null>(null);
	const [thinkingTime, setThinkingTime] = useState<number | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const reasoningStartTimeRef = useRef<number | null>(null);
	const lastRequestBodyRef = useRef<Record<string, unknown> | undefined>(body);

	// Derived state
	const isLoading = status === "submitted" || status === "streaming";

	// Stop streaming request
	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setStatus("ready");
	}, []);

	// Trim messages to maintain maximum history
	const trimMessages = useCallback(
		(msgs: Messages): Messages => {
			if (msgs.length <= maxMessages) return msgs;
			return msgs.slice(-maxMessages);
		},
		[maxMessages],
	);

	// Append a message and get streaming response
	const append = useCallback(
		async (
			message: Pick<MessageItem, "content" | "role">,
			options?: AppendOptions,
		) => {
			stop(); // Cancel any existing request

			const userMessage: MessageItem = {
				role: message.role,
				content: message.content,
			};

			const newMessages = trimMessages([...messages, userMessage]);
			setMessages(newMessages);
			setError(null);
			setStatus("submitted");
			setThinkingTime(null); // Reset thinking time
			reasoningStartTimeRef.current = null; // Reset reasoning start time
			lastRequestBodyRef.current = options?.requestBody;

			try {
				const controller = new AbortController();
				abortControllerRef.current = controller;

				const response = await fetch(api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(typeof window !== "undefined" && {
							Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
						}),
					},
					body: JSON.stringify({
						messages: newMessages,
						stream: true,
						...body,
						...options?.requestBody,
					}),
					signal: controller.signal,
				});

				if (!response.ok) {
					const errorText = await response.text().catch(() => "Unknown error");
					throw new Error(`HTTP ${response.status}: ${errorText}`);
				}

				setStatus("streaming");

				// Process SSE stream with message updates
				const finalMessages = await processSSEStream(
					response,
					newMessages,
					(updatedMessages) => {
						setMessages(trimMessages(updatedMessages));
					},
					// Callback when reasoning starts (first reasoning_content received)
					() => {
						if (!reasoningStartTimeRef.current) {
							reasoningStartTimeRef.current = Date.now();
						}
					},
					// Callback when reasoning ends (content starts)
					() => {
						if (reasoningStartTimeRef.current) {
							const time = (Date.now() - reasoningStartTimeRef.current) / 1000;
							setThinkingTime(time);
						}
					},
				);

				setStatus("ready");

				// Find the last assistant message with content for onFinish callback
				const lastAssistantMessage = [...finalMessages]
					.reverse()
					.find((m) => m.role === "assistant" && m.content);

				if (lastAssistantMessage) {
					onFinish?.(lastAssistantMessage, trimMessages(finalMessages));
				}
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					const error = err instanceof Error ? err : new Error("Unknown error");
					setError(error);
					setStatus("error");
					onError?.(error);
				}
			} finally {
				abortControllerRef.current = null;
				reasoningStartTimeRef.current = null;
			}
		},
		[api, body, messages, onFinish, onError, stop, trimMessages],
	);

	// Reload the last assistant response
	const reload = useCallback(async () => {
		const lastUserMessage = [...messages]
			.reverse()
			.find((m) => m.role === "user");
		if (!lastUserMessage) return;

		// Remove all messages after the last user message
		const lastUserIndex = messages.lastIndexOf(lastUserMessage);
		const messagesToKeep = messages.slice(0, lastUserIndex + 1);
		setMessages(messagesToKeep);

		await append(
			{
				role: lastUserMessage.role,
				content: lastUserMessage.content,
			},
			{
				requestBody: lastRequestBodyRef.current,
			},
		);
	}, [messages, append]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stop();
		};
	}, [stop]);

	return {
		input,
		setInput,
		messages,
		setMessages,
		status,
		isLoading,
		error,
		thinkingTime,
		append,
		reload,
		stop,
	};
};

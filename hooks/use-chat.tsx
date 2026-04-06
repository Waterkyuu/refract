"use client";

import jotaiStore from "@/atoms";
import {
	agentStatusAtom,
	clearToolEventsAtom,
	dispatchToolEventAtom,
	vncUrlAtom,
} from "@/atoms/chat";
import type { ToolCallEvent } from "@/types/chat";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";

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
		options?: { body?: Record<string, unknown> },
	) => Promise<void>;
	reload: () => Promise<void>;
	stop: () => void;
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
		}
	}

	return events;
};

export type { UseChatReturn, ChatStatus };
export { extractToolEventsFromMessages };

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
	const reasoningStartTimeRef = useRef<number | null>(null);
	const processedToolCallsRef = useRef(new Map<string, ToolCallEvent>());

	const chat = useChat({
		id: sessionId,
		messages: initialMessages,
	});

	const messages = chat.messages;
	const status = chat.status;

	useEffect(() => {
		if (!sessionId || initialMessages.length === 0 || messages.length > 0) {
			return;
		}

		// Restore persisted history after the session is created before IndexedDB
		// finishes loading, without overwriting an active in-memory conversation.
		chat.setMessages(initialMessages);
	}, [chat, initialMessages, messages.length, sessionId]);

	useEffect(() => {
		for (const msg of messages) {
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
	}, [messages]);

	useEffect(() => {
		const events = extractToolEventsFromMessages(
			messages,
			processedToolCallsRef.current,
		);
		for (const event of events) {
			processedToolCallsRef.current.set(event.toolCallId, event);
			jotaiStore.set(dispatchToolEventAtom, event);
		}
	}, [messages]);

	useEffect(() => {
		if (status === "ready" && messages.length > 0) {
			reasoningStartTimeRef.current = null;
			onFinish?.(messages);
		}
	}, [status, messages.length, onFinish]);

	useEffect(() => {
		if (status === "error" && chat.error) {
			onError?.(chat.error);
		}
	}, [status, chat.error, onError]);

	const append = useCallback(
		async (text: string, opts?: { body?: Record<string, unknown> }) => {
			setThinkingTime(null);
			reasoningStartTimeRef.current = null;
			processedToolCallsRef.current.clear();
			jotaiStore.set(clearToolEventsAtom);
			jotaiStore.set(agentStatusAtom, "thinking");

			await chat.sendMessage({ text }, { body: { ...opts?.body, api } });
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
		jotaiStore.set(agentStatusAtom, "idle");
	}, [chat]);

	return {
		input,
		setInput,
		messages,
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

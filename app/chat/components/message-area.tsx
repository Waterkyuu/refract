"use client";

import type { WorkspaceRoundArtifact } from "@/lib/chat/workspace-hydration";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types/chat";
import type { UIMessage } from "ai";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useRef, useState } from "react";
import ChatHistorySkeleton from "./chat-history-skeleton";
import MessageItem from "./message-item";

type MessageAreaProps = {
	messages: UIMessage[];
	thinkingTime: number | null;
	className?: string;
	isLoading?: boolean;
	onSelectAttachment?: (attachment: ChatAttachment) => void;
	onSelectRoundArtifact?: (artifact: WorkspaceRoundArtifact) => void;
	onShowVnc?: () => void;
	isHistoryLoading?: boolean;
};

const AUTO_SCROLL_THRESHOLD = 80;

const MessageArea = ({
	messages,
	thinkingTime,
	className,
	isLoading = false,
	onSelectAttachment,
	onSelectRoundArtifact,
	onShowVnc,
	isHistoryLoading = false,
}: MessageAreaProps) => {
	const t = useTranslations("chat");
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const previousLastMessageRef = useRef<UIMessage | undefined>(undefined);
	const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
	const [thinkingTimesByMessageId, setThinkingTimesByMessageId] = useState<
		Record<string, number>
	>({});

	const isNearBottom = (element: HTMLDivElement) => {
		const distanceToBottom =
			element.scrollHeight - element.scrollTop - element.clientHeight;

		return distanceToBottom <= AUTO_SCROLL_THRESHOLD;
	};

	const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		container.scrollTo({
			top: container.scrollHeight,
			behavior,
		});
	};

	const handleScroll = () => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		setIsAutoScrollEnabled(isNearBottom(container));
	};

	useEffect(() => {
		const lastMessage = messages.at(-1);
		const previousLastMessage = previousLastMessageRef.current;

		if (
			lastMessage?.role === "user" &&
			lastMessage.id !== previousLastMessage?.id
		) {
			setIsAutoScrollEnabled(true);
		}

		previousLastMessageRef.current = lastMessage;
	}, [messages]);

	useEffect(() => {
		if (messages.length === 0) {
			setThinkingTimesByMessageId({});
		}
	}, [messages.length]);

	useEffect(() => {
		const latestAssistantMessage = [...messages]
			.reverse()
			.find((message) => message.role === "assistant");
		if (!latestAssistantMessage || thinkingTime == null) {
			return;
		}

		setThinkingTimesByMessageId((currentTimes) => {
			if (currentTimes[latestAssistantMessage.id] === thinkingTime) {
				return currentTimes;
			}

			return {
				...currentTimes,
				[latestAssistantMessage.id]: thinkingTime,
			};
		});
	}, [messages, thinkingTime]);

	useEffect(() => {
		if (!isAutoScrollEnabled || isHistoryLoading) {
			return;
		}

		scrollToBottom();
	}, [isAutoScrollEnabled, isHistoryLoading, messages]);

	const hasToolCalls = messages.some((msg) =>
		msg.parts.some(
			(p) => typeof p.type === "string" && p.type.startsWith("tool-"),
		),
	);
	const latestMessage = messages.at(-1);
	const shouldShowLoading =
		!isHistoryLoading && isLoading && latestMessage?.role !== "assistant";

	return (
		<div
			data-slot="message-area"
			className={cn("relative flex-1 overflow-hidden", className)}
		>
			<div
				ref={scrollContainerRef}
				data-testid="message-area-scroll-container"
				className="custom-scrollbar flex h-full w-full flex-col overflow-y-auto overflow-x-hidden px-2 py-4"
				onScroll={handleScroll}
			>
				{isHistoryLoading && <ChatHistorySkeleton className="px-2 py-0" />}

				{!isHistoryLoading && messages.length === 0 && (
					<div className="flex flex-1 items-center justify-center">
						<p className="text-muted-foreground text-xs sm:text-sm">
							{t("sendMessage")}
						</p>
					</div>
				)}

				{!isHistoryLoading &&
					messages.map((message) => (
						<MessageItem
							key={message.id}
							message={message}
							thinkingTime={
								message.role === "assistant"
									? (thinkingTimesByMessageId[message.id] ?? null)
									: null
							}
							hasToolCalls={hasToolCalls}
							onSelectAttachment={onSelectAttachment}
							onSelectRoundArtifact={onSelectRoundArtifact}
							onShowVnc={onShowVnc}
						/>
					))}

				{shouldShowLoading && (
					<div
						data-testid="message-area-loading"
						className="flex justify-start gap-3 px-4 py-3"
					>
						<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border bg-white">
							<img
								src="/logo.svg"
								alt="Assistant avatar"
								className="size-4 object-contain"
							/>
						</div>
						<div className="min-w-0 max-w-[min(80%,42rem)] rounded-2xl bg-muted px-4 py-3">
							<div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<LoaderCircle className="size-4 animate-spin" />
								<div className="flex items-center gap-1">
									<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:0ms]" />
									<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
									<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
			{messages.length > 0 && !isAutoScrollEnabled && (
				<div className="pointer-events-none absolute right-4 bottom-4">
					<button
						type="button"
						className="pointer-events-auto inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs shadow-sm transition-colors duration-200 hover:bg-muted sm:text-sm"
						onClick={() => {
							scrollToBottom("smooth");
							setIsAutoScrollEnabled(true);
						}}
					>
						<ChevronDown className="size-4" />
						{t("jumpToLatest")}
					</button>
				</div>
			)}
		</div>
	);
};

export default memo(MessageArea);

"use client";

import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types/chat";
import type { UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import ChatHistorySkeleton from "./chat-history-skeleton";
import MessageItem from "./message-item";

type MessageAreaProps = {
	messages: UIMessage[];
	thinkingTime: number | null;
	className?: string;
	onSelectAttachment?: (attachment: ChatAttachment) => void;
	onShowVnc?: () => void;
	isHistoryLoading?: boolean;
};

const MessageArea = ({
	messages,
	thinkingTime,
	className,
	onSelectAttachment,
	onShowVnc,
	isHistoryLoading = false,
}: MessageAreaProps) => {
	const t = useTranslations("chat");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const hasToolCalls = messages.some((msg) =>
		msg.parts.some(
			(p) => typeof p.type === "string" && p.type.startsWith("tool-"),
		),
	);

	return (
		<div
			ref={containerRef}
			data-slot="message-area"
			className={cn("relative flex-1 overflow-hidden", className)}
		>
			<div className="custom-scrollbar flex h-full w-full flex-col overflow-y-auto px-2 py-4">
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
							thinkingTime={message.role === "assistant" ? thinkingTime : null}
							hasToolCalls={hasToolCalls}
							onSelectAttachment={onSelectAttachment}
							onShowVnc={onShowVnc}
						/>
					))}

				<div ref={messagesEndRef} />
			</div>
		</div>
	);
};

export default MessageArea;

"use client";

import type { UseChatReturn } from "@/hooks/use-chat";
import { useRef } from "react";

type MessageAreaProps = {
	className?: string;
} & Pick<
	UseChatReturn,
	"messages" | "setMessages" | "status" | "reload" | "error" | "thinkingTime"
>;

const MessageArea = () => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	return (
		<div className="relative flex-1 overflow-hidden">
			<div className="custom-scrollbar flex h-full w-full flex-col overflow-y-auto px-8 py-4">
				{/*  Rolling anchor point */}
				<div ref={messagesEndRef} />
			</div>
		</div>
	);
};

export default MessageArea;

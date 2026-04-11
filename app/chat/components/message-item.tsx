import type { ChatAttachment } from "@/types/chat";
import type { UIMessage } from "ai";
import { memo } from "react";
import AssistantMessage from "./assistant-message";
import UserMessage from "./user-message";

type MessageItemProps = {
	message: UIMessage;
	thinkingTime: number | null;
	hasToolCalls: boolean;
	onSelectAttachment?: (attachment: ChatAttachment) => void;
	onShowVnc?: () => void;
};

const MessageItem = memo(
	({
		message,
		thinkingTime,
		onSelectAttachment,
		onShowVnc,
	}: MessageItemProps) => {
		if (message.role === "user") {
			return (
				<UserMessage
					message={message}
					onSelectAttachment={onSelectAttachment}
				/>
			);
		}

		return (
			<AssistantMessage
				message={message}
				thinkingTime={thinkingTime}
				onShowVnc={onShowVnc}
			/>
		);
	},
);

export default MessageItem;

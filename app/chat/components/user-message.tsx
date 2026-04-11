"use client";

import FileCard from "@/components/share/file-card";
import type { ChatAttachment, ChatMessageMetadata } from "@/types/chat";
import type { UIMessage } from "ai";
import { User } from "lucide-react";
import { memo, useMemo } from "react";

type UserMessageProps = {
	message: UIMessage;
	onSelectAttachment?: (attachment: ChatAttachment) => void;
};

const UserMessage = memo(
	({ message, onSelectAttachment }: UserMessageProps) => {
		const metadata = message.metadata as ChatMessageMetadata | undefined;
		const attachments = metadata?.attachments ?? [];

		const textParts = useMemo(
			() => message.parts.filter((p) => p.type === "text"),
			[message.parts],
		);

		return (
			<div className="flex justify-end gap-3 px-4 py-3">
				<div className="order-first flex min-w-0 max-w-[80%] flex-col items-end space-y-1">
					{textParts.map((part, i) => {
						const textPart = part as { text: string };
						if (!textPart.text) return null;

						return (
							<div
								key={`text-${i}`}
								className="rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground text-xs leading-relaxed sm:text-sm"
							>
								<p className="whitespace-pre-wrap break-words">
									{textPart.text}
								</p>
							</div>
						);
					})}
					{attachments.length > 0 && (
						<div className="flex flex-wrap justify-end gap-3 pt-1">
							{attachments.map((attachment) => (
								<button
									key={`${message.id}-${attachment.fileId}`}
									type="button"
									className="rounded-2xl"
									onClick={() => onSelectAttachment?.(attachment)}
								>
									<FileCard
										className="w-[15rem] max-w-full"
										extension={attachment.extension}
										fileName={attachment.filename}
										fileSize={attachment.fileSize}
										isClickable
									/>
								</button>
							))}
						</div>
					)}
				</div>

				<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
					<User className="size-3.5 text-muted-foreground" />
				</div>
			</div>
		);
	},
);

export default UserMessage;

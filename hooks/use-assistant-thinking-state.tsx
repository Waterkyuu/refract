import {
	type AssistantThinkingStateByMessageId,
	applyAssistantThinkingStateToMessages,
	deriveAssistantThinkingStateByMessageId,
} from "@/lib/chat/reasoning-timing";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";

type AssistantThinkingTimeByMessageId = Record<string, number | null>;

const useAssistantThinkingState = (
	messages: UIMessage[],
	thinkingTime: number | null,
) => {
	const [
		assistantThinkingStateByMessageId,
		setAssistantThinkingStateByMessageId,
	] = useState<AssistantThinkingStateByMessageId>(() =>
		deriveAssistantThinkingStateByMessageId({}, messages, thinkingTime),
	);

	useEffect(() => {
		setAssistantThinkingStateByMessageId((currentStateByMessageId) =>
			deriveAssistantThinkingStateByMessageId(
				currentStateByMessageId,
				messages,
				thinkingTime,
			),
		);
	}, [messages, thinkingTime]);

	const resolvedMessages = useMemo(
		() =>
			applyAssistantThinkingStateToMessages(
				messages,
				assistantThinkingStateByMessageId,
			),
		[messages, assistantThinkingStateByMessageId],
	);

	const assistantThinkingTimeByMessageId = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(assistantThinkingStateByMessageId).map(
					([messageId, state]) => [messageId, state.messageTime],
				),
			) as AssistantThinkingTimeByMessageId,
		[assistantThinkingStateByMessageId],
	);

	return {
		assistantThinkingStateByMessageId,
		assistantThinkingTimeByMessageId,
		resolvedMessages,
	};
};

export default useAssistantThinkingState;
export type { AssistantThinkingTimeByMessageId };

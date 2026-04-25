import type { UIMessage } from "ai";

type RenderableMessagePart = Record<string, unknown>;
type ReasoningThinkingTimesByPartIndex = Record<number, number>;

type ReasoningMessagePart = RenderableMessagePart & {
	type: "reasoning";
	text: string;
	durationSeconds?: number;
};

type AssistantThinkingState = {
	messageTime: number | null;
	reasoningThinkingTimesByPartIndex: ReasoningThinkingTimesByPartIndex;
};

type AssistantThinkingStateByMessageId = Record<string, AssistantThinkingState>;

const isRenderableMessagePart = (part: UIMessage["parts"][number]) =>
	part.type !== "step-start";

const isAssistantMessage = (message: UIMessage) => message.role === "assistant";

const getRenderableMessageParts = (
	message: UIMessage,
): RenderableMessagePart[] =>
	message.parts.filter(
		isRenderableMessagePart,
	) as unknown as RenderableMessagePart[];

const createAssistantThinkingState = (): AssistantThinkingState => ({
	messageTime: null,
	reasoningThinkingTimesByPartIndex: {},
});

const isReasoningMessagePart = (
	part: Record<string, unknown>,
): part is ReasoningMessagePart => part.type === "reasoning";

const getReasoningDurationSeconds = (
	part: Record<string, unknown>,
): number | undefined =>
	typeof part.durationSeconds === "number" ? part.durationSeconds : undefined;

const mergePersistedReasoningThinkingTimes = (
	parts: RenderableMessagePart[],
	currentReasoningThinkingTimesByPartIndex: ReasoningThinkingTimesByPartIndex,
) => {
	let nextReasoningThinkingTimesByPartIndex =
		currentReasoningThinkingTimesByPartIndex;

	for (const [index, part] of parts.entries()) {
		if (!isReasoningMessagePart(part)) {
			continue;
		}

		const durationSeconds = getReasoningDurationSeconds(part);
		if (
			durationSeconds == null ||
			nextReasoningThinkingTimesByPartIndex[index] === durationSeconds
		) {
			continue;
		}

		nextReasoningThinkingTimesByPartIndex = {
			...nextReasoningThinkingTimesByPartIndex,
			[index]: durationSeconds,
		};
	}

	return nextReasoningThinkingTimesByPartIndex;
};

const findLastCompletedReasoningPartIndexWithoutTime = (
	parts: RenderableMessagePart[],
	reasoningThinkingTimesByPartIndex: ReasoningThinkingTimesByPartIndex,
) => {
	for (let index = parts.length - 1; index >= 0; index -= 1) {
		const part = parts[index];
		if (!part || !isReasoningMessagePart(part)) {
			continue;
		}

		if (
			getReasoningDurationSeconds(part) != null ||
			reasoningThinkingTimesByPartIndex[index] != null
		) {
			continue;
		}

		if (index < parts.length - 1) {
			return index;
		}
	}

	return null;
};

const applyLatestThinkingTimeToReasoning = (
	parts: RenderableMessagePart[],
	currentReasoningThinkingTimesByPartIndex: ReasoningThinkingTimesByPartIndex,
	thinkingTime: number | null,
) => {
	if (thinkingTime == null) {
		return currentReasoningThinkingTimesByPartIndex;
	}

	const latestCompletedReasoningPartIndex =
		findLastCompletedReasoningPartIndexWithoutTime(
			parts,
			currentReasoningThinkingTimesByPartIndex,
		);

	if (
		latestCompletedReasoningPartIndex == null ||
		currentReasoningThinkingTimesByPartIndex[
			latestCompletedReasoningPartIndex
		] === thinkingTime
	) {
		return currentReasoningThinkingTimesByPartIndex;
	}

	return {
		...currentReasoningThinkingTimesByPartIndex,
		[latestCompletedReasoningPartIndex]: thinkingTime,
	};
};

const hasAssistantThinkingState = (state: AssistantThinkingState) =>
	state.messageTime != null ||
	Object.keys(state.reasoningThinkingTimesByPartIndex).length > 0;

const areReasoningThinkingTimesEqual = (
	first: ReasoningThinkingTimesByPartIndex,
	second: ReasoningThinkingTimesByPartIndex,
) => {
	const firstEntries = Object.entries(first);
	const secondEntries = Object.entries(second);

	if (firstEntries.length !== secondEntries.length) {
		return false;
	}

	return firstEntries.every(
		([index, value]) => second[Number(index)] === value,
	);
};

const areAssistantThinkingStatesEqual = (
	first: AssistantThinkingStateByMessageId,
	second: AssistantThinkingStateByMessageId,
) => {
	const firstEntries = Object.entries(first);
	const secondEntries = Object.entries(second);

	if (firstEntries.length !== secondEntries.length) {
		return false;
	}

	return firstEntries.every(([messageId, firstState]) => {
		const secondState = second[messageId];
		if (!secondState) {
			return false;
		}

		return (
			firstState.messageTime === secondState.messageTime &&
			areReasoningThinkingTimesEqual(
				firstState.reasoningThinkingTimesByPartIndex,
				secondState.reasoningThinkingTimesByPartIndex,
			)
		);
	});
};

const deriveAssistantThinkingStateByMessageId = (
	currentStateByMessageId: AssistantThinkingStateByMessageId,
	messages: UIMessage[],
	thinkingTime: number | null,
) => {
	const assistantMessages = messages.filter(isAssistantMessage);
	const latestAssistantMessage = assistantMessages.at(-1);

	if (!latestAssistantMessage) {
		return Object.keys(currentStateByMessageId).length === 0
			? currentStateByMessageId
			: {};
	}

	const nextStateByMessageId = Object.fromEntries(
		assistantMessages.flatMap((message) => {
			const previousState =
				currentStateByMessageId[message.id] ?? createAssistantThinkingState();
			const renderableParts = getRenderableMessageParts(message);
			const persistedReasoningThinkingTimesByPartIndex =
				mergePersistedReasoningThinkingTimes(
					renderableParts,
					previousState.reasoningThinkingTimesByPartIndex,
				);
			const reasoningThinkingTimesByPartIndex =
				message.id === latestAssistantMessage.id
					? applyLatestThinkingTimeToReasoning(
							renderableParts,
							persistedReasoningThinkingTimesByPartIndex,
							thinkingTime,
						)
					: persistedReasoningThinkingTimesByPartIndex;
			const messageTime =
				message.id === latestAssistantMessage.id && thinkingTime != null
					? thinkingTime
					: previousState.messageTime;
			const nextState: AssistantThinkingState = {
				messageTime,
				reasoningThinkingTimesByPartIndex,
			};

			return hasAssistantThinkingState(nextState)
				? [[message.id, nextState]]
				: [];
		}),
	) as AssistantThinkingStateByMessageId;

	return areAssistantThinkingStatesEqual(
		currentStateByMessageId,
		nextStateByMessageId,
	)
		? currentStateByMessageId
		: nextStateByMessageId;
};

const applyReasoningThinkingTimesToMessage = (
	message: UIMessage,
	reasoningThinkingTimesByPartIndex: ReasoningThinkingTimesByPartIndex,
) => {
	let nextRenderablePartIndex = 0;
	let hasChanges = false;

	const nextParts = message.parts.map((part) => {
		if (!isRenderableMessagePart(part)) {
			return part;
		}

		const currentRenderablePartIndex = nextRenderablePartIndex;
		nextRenderablePartIndex += 1;

		if (part.type !== "reasoning") {
			return part;
		}

		const nextDurationSeconds =
			reasoningThinkingTimesByPartIndex[currentRenderablePartIndex];
		if (
			nextDurationSeconds == null ||
			getReasoningDurationSeconds(part as Record<string, unknown>) ===
				nextDurationSeconds
		) {
			return part;
		}

		hasChanges = true;
		return {
			...part,
			durationSeconds: nextDurationSeconds,
		};
	});

	return hasChanges ? { ...message, parts: nextParts } : message;
};

const applyAssistantThinkingStateToMessages = (
	messages: UIMessage[],
	assistantThinkingStateByMessageId: AssistantThinkingStateByMessageId,
) =>
	messages.map((message) => {
		if (!isAssistantMessage(message)) {
			return message;
		}

		const assistantThinkingState =
			assistantThinkingStateByMessageId[message.id];
		if (!assistantThinkingState) {
			return message;
		}

		return applyReasoningThinkingTimesToMessage(
			message,
			assistantThinkingState.reasoningThinkingTimesByPartIndex,
		);
	});

export {
	applyAssistantThinkingStateToMessages,
	createAssistantThinkingState,
	deriveAssistantThinkingStateByMessageId,
	findLastCompletedReasoningPartIndexWithoutTime,
	getReasoningDurationSeconds,
	getRenderableMessageParts,
	isReasoningMessagePart,
};
export type {
	AssistantThinkingState,
	AssistantThinkingStateByMessageId,
	RenderableMessagePart,
	ReasoningMessagePart,
	ReasoningThinkingTimesByPartIndex,
};

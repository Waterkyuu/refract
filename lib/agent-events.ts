import type { AgentState, AgentStatus, ToolCallEvent } from "@/types";

type AgentAction =
	| {
			type: "hydrate";
			payload: {
				events: ToolCallEvent[];
				vncUrl: string | null;
				status?: AgentStatus;
			};
	  }
	| { type: "reset" }
	| { type: "set-status"; payload: AgentStatus }
	| { type: "set-vnc-url"; payload: string | null }
	| { type: "record-event"; payload: ToolCallEvent };

const trackedStats = new Set(["click", "type", "scroll"]);

const createInitialAgentState = (): AgentState => ({
	status: "idle",
	events: [],
	stats: {
		click: 0,
		type: 0,
		scroll: 0,
	},
	vncUrl: null,
});

const serializePayloadValue = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	if (Array.isArray(value)) {
		return value.join(", ");
	}

	if (value && typeof value === "object") {
		return JSON.stringify(value);
	}

	return "n/a";
};

const summarizeEventPayload = (
	payload: Record<string, unknown>,
	maxEntries = 3,
): string => {
	const entries = Object.entries(payload).slice(0, maxEntries);

	if (entries.length === 0) {
		return "No payload";
	}

	return entries
		.map(([key, value]) => `${key}: ${serializePayloadValue(value)}`)
		.join(" | ");
};

const formatEventTimestamp = (timestamp: number): string =>
	new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: "UTC",
	}).format(timestamp);

const formatEventDuration = (duration?: number): string => {
	if (!duration) {
		return "Pending";
	}

	if (duration < 1000) {
		return `${duration}ms`;
	}

	return `${(duration / 1000).toFixed(1)}s`;
};

const buildToolCallEvent = (
	event: Omit<ToolCallEvent, "summary"> & { summary?: string },
): ToolCallEvent => ({
	...event,
	summary: event.summary ?? summarizeEventPayload(event.payload),
});

const calculateStats = (events: ToolCallEvent[]): AgentState["stats"] =>
	events.reduce(
		(stats, event) => {
			if (
				event.status === "success" &&
				trackedStats.has(event.type) &&
				event.type in stats
			) {
				stats[event.type as keyof typeof stats] += 1;
			}

			return stats;
		},
		{
			click: 0,
			type: 0,
			scroll: 0,
		},
	);

const upsertEvent = (events: ToolCallEvent[], nextEvent: ToolCallEvent) => {
	const nextEvents = [...events];
	const targetIndex = nextEvents.findIndex(
		(event) => event.id === nextEvent.id,
	);

	if (targetIndex >= 0) {
		nextEvents[targetIndex] = nextEvent;
	} else {
		nextEvents.push(nextEvent);
	}

	return nextEvents.sort((left, right) => left.timestamp - right.timestamp);
};

const reduceAgentState = (
	state: AgentState,
	action: AgentAction,
): AgentState => {
	switch (action.type) {
		case "hydrate": {
			const events = [...action.payload.events].sort(
				(left, right) => left.timestamp - right.timestamp,
			);

			return {
				status: action.payload.status ?? "idle",
				events,
				stats: calculateStats(events),
				vncUrl: action.payload.vncUrl,
			};
		}

		case "reset":
			return createInitialAgentState();

		case "set-status":
			return {
				...state,
				status: action.payload,
			};

		case "set-vnc-url":
			return {
				...state,
				vncUrl: action.payload,
			};

		case "record-event": {
			const events = upsertEvent(state.events, action.payload);

			return {
				...state,
				events,
				stats: calculateStats(events),
			};
		}

		default:
			return state;
	}
};

export {
	buildToolCallEvent,
	createInitialAgentState,
	formatEventDuration,
	formatEventTimestamp,
	reduceAgentState,
	summarizeEventPayload,
	type AgentAction,
};

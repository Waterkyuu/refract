import {
	buildToolCallEvent,
	formatEventDuration,
	formatEventTimestamp,
	reduceAgentState,
	summarizeEventPayload,
} from "@/lib/agent-events";

describe("agent-events helpers", () => {
	it("summarizes payload values in a readable format", () => {
		expect(
			summarizeEventPayload({
				query: "chatgpt.com",
				page: 1,
				metadata: { source: "google" },
			}),
		).toBe('query: chatgpt.com | page: 1 | metadata: {"source":"google"}');
	});

	it("formats timestamps and durations for debug output", () => {
		expect(formatEventTimestamp(Date.UTC(2026, 3, 5, 8, 9, 10))).toBe(
			"08:09:10",
		);
		expect(formatEventDuration(240)).toBe("240ms");
		expect(formatEventDuration(1400)).toBe("1.4s");
	});

	it("tracks stats only when tool calls complete successfully", () => {
		const pendingTypeEvent = buildToolCallEvent({
			id: "evt-1",
			timestamp: 1,
			type: "type",
			payload: {
				text: "chatgpt.com",
			},
			status: "pending",
		});

		const successfulTypeEvent = buildToolCallEvent({
			...pendingTypeEvent,
			status: "success",
			duration: 120,
		});

		const nextState = reduceAgentState(
			reduceAgentState(
				{
					status: "idle",
					events: [],
					stats: {
						click: 0,
						type: 0,
						scroll: 0,
					},
					vncUrl: null,
				},
				{
					type: "record-event",
					payload: pendingTypeEvent,
				},
			),
			{
				type: "record-event",
				payload: successfulTypeEvent,
			},
		);

		expect(nextState.events).toHaveLength(1);
		expect(nextState.stats.type).toBe(1);
	});
});

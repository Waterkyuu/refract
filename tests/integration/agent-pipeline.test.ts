import { createInitialAgentState, reduceAgentState } from "@/lib/agent-events";
import { runMockAgentTurn } from "@/lib/agent-runtime";

describe("agent pipeline integration", () => {
	it("records streamed tool calls and state changes across one agent turn", async () => {
		let state = createInitialAgentState();

		await runMockAgentTurn("Search chatgpt.com", {
			delayMs: 0,
			onStatusChange: (status) => {
				state = reduceAgentState(state, {
					type: "set-status",
					payload: status,
				});
			},
			onToolEvent: (event) => {
				state = reduceAgentState(state, {
					type: "record-event",
					payload: event,
				});
			},
			onVncUrl: (url) => {
				state = reduceAgentState(state, {
					type: "set-vnc-url",
					payload: url,
				});
			},
		});

		expect(state.status).toBe("idle");
		expect(state.vncUrl).toContain("e2b.dev");
		expect(state.events.length).toBeGreaterThanOrEqual(5);
		expect(state.events.every((event) => event.status === "success")).toBe(
			true,
		);
		expect(state.stats.click).toBeGreaterThan(0);
		expect(state.stats.type).toBeGreaterThan(0);
	});
});

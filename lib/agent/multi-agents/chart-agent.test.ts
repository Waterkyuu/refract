import { CHART_AGENT_PROMPT } from "./chart-agent";

describe("CHART_AGENT_PROMPT", () => {
	it("requires immediate chart persistence before the final JSON response", () => {
		expect(CHART_AGENT_PROMPT).toContain(
			"Immediately call persistLatestChart after generating each chart",
		);
		expect(CHART_AGENT_PROMPT).toContain(
			"Do NOT wait until the end of the step to persist charts",
		);
		expect(CHART_AGENT_PROMPT).toContain(
			"Before printing the final JSON, verify every chart you intend to keep has a persisted artifact",
		);
	});
});

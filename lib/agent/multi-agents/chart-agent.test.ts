import { CHART_AGENT_PROMPT } from "./chart-agent";

describe("CHART_AGENT_PROMPT", () => {
	it("requires persistAllCharts after all charts are generated", () => {
		expect(CHART_AGENT_PROMPT).toContain("persistAllCharts");
		expect(CHART_AGENT_PROMPT).toContain("MANDATORY");
	});

	it("instructs to generate all charts first then persist once", () => {
		expect(CHART_AGENT_PROMPT).toContain(
			"call persistAllCharts exactly ONCE after ALL charts",
		);
	});

	it("forbids calling persistAllCharts multiple times", () => {
		expect(CHART_AGENT_PROMPT).toContain(
			"Do NOT call persistAllCharts more than once",
		);
	});
});

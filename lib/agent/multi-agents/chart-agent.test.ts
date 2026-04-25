import { CHART_AGENT_PROMPT } from "./chart-agent";

describe("CHART_AGENT_PROMPT", () => {
	it("requires persistAllCharts after all charts are generated", () => {
		expect(CHART_AGENT_PROMPT).toContain("persistAllCharts");
		expect(CHART_AGENT_PROMPT).toContain("MANDATORY");
	});

	it("instructs to generate all charts first then persist once", () => {
		expect(CHART_AGENT_PROMPT).toContain(
			"persistAllCharts (ONLY ONE call, after ALL charts are done)",
		);
	});

	it("forbids calling persistAllCharts multiple times", () => {
		expect(CHART_AGENT_PROMPT).toContain(
			"Do NOT call persistAllCharts more than once",
		);
	});

	it("forbids plt.close and plt.savefig so charts render inline", () => {
		expect(CHART_AGENT_PROMPT).toContain("Do NOT use plt.close()");
		expect(CHART_AGENT_PROMPT).toContain("Do NOT use plt.savefig()");
	});

	it("allows subplots only for comparing related data dimensions", () => {
		expect(CHART_AGENT_PROMPT).toContain("One figure per chart");
		expect(CHART_AGENT_PROMPT).toContain("plt.subplots() is ONLY allowed");
	});

	it("provides correct example codeInterpreter call", () => {
		expect(CHART_AGENT_PROMPT).toContain("plt.figure(");
		expect(CHART_AGENT_PROMPT).toContain("NO plt.savefig()");
	});
});

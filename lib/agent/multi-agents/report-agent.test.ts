import { REPORT_AGENT_PROMPT, buildReportAgentPrompt } from "./report-agent";

describe("REPORT_AGENT_PROMPT", () => {
	it("requires loadSkill calls for typst-expert and a category skill", () => {
		expect(REPORT_AGENT_PROMPT).toContain('loadSkill("typst-expert")');
		expect(REPORT_AGENT_PROMPT).toContain('loadSkill("report-expert")');
		expect(REPORT_AGENT_PROMPT).toContain('loadSkill("paper-expert")');
		expect(REPORT_AGENT_PROMPT).toContain('loadSkill("resume-expert")');
	});

	it("requires typst code block output without JSON", () => {
		expect(REPORT_AGENT_PROMPT).toContain("```typst");
		expect(REPORT_AGENT_PROMPT).toContain("Do NOT output any JSON");
		expect(REPORT_AGENT_PROMPT).toContain(
			"Do NOT call codeInterpreter or persistCodeFile",
		);
	});

	it("requires Typst text font fallback for browser rendering", () => {
		expect(REPORT_AGENT_PROMPT).toContain("fallback: true");
		expect(REPORT_AGENT_PROMPT).toContain("New Computer Modern");
		expect(REPORT_AGENT_PROMPT).toContain("Microsoft YaHei");
	});

	it("injects learned Typst corrections when provided", () => {
		const prompt = buildReportAgentPrompt(
			"## Learned typst corrections\n1. Inline math spacing",
		);

		expect(prompt).toContain("## Learned typst corrections");
		expect(prompt).toContain("Inline math spacing");
	});
});

import { REPORT_AGENT_PROMPT } from "./report-agent";

describe("REPORT_AGENT_PROMPT", () => {
	it("enforces loading typst-expert before any category-specific skill", () => {
		const typstRuleIndex = REPORT_AGENT_PROMPT.indexOf(
			'loadSkill("typst-expert") first',
		);
		const reportRuleIndex = REPORT_AGENT_PROMPT.indexOf(
			'loadSkill("report-expert")',
		);
		const paperRuleIndex = REPORT_AGENT_PROMPT.indexOf(
			'loadSkill("paper-expert")',
		);
		const resumeRuleIndex = REPORT_AGENT_PROMPT.indexOf(
			'loadSkill("resume-expert")',
		);

		expect(typstRuleIndex).toBeGreaterThan(-1);
		expect(reportRuleIndex).toBeGreaterThan(typstRuleIndex);
		expect(paperRuleIndex).toBeGreaterThan(typstRuleIndex);
		expect(resumeRuleIndex).toBeGreaterThan(typstRuleIndex);
	});

	it("requires typst code block output and persisted .typ file metadata", () => {
		expect(REPORT_AGENT_PROMPT).toContain("```typst");
		expect(REPORT_AGENT_PROMPT).toContain("/home/user/output/report.typ");
		expect(REPORT_AGENT_PROMPT).toContain('"format": "typst"');
		expect(REPORT_AGENT_PROMPT).toContain("persistCodeFile");
	});
});

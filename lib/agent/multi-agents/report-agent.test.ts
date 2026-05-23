import { REPORT_AGENT_PROMPT, buildReportAgentPrompt } from "./report-agent";

describe("REPORT_AGENT_PROMPT", () => {
	it("requires loadSkill calls for markdown-author and markdown-report", () => {
		expect(REPORT_AGENT_PROMPT).toContain('loadSkill("markdown-author")');
		expect(REPORT_AGENT_PROMPT).toContain('loadSkill("markdown-report")');
	});

	it("requires markdown code block output without JSON", () => {
		expect(REPORT_AGENT_PROMPT).toContain("```markdown");
		expect(REPORT_AGENT_PROMPT).toContain("Do NOT output any JSON");
		expect(REPORT_AGENT_PROMPT).toContain(
			"Do NOT call codeInterpreter or persistCodeFile",
		);
	});

	it("buildReportAgentPrompt returns the base prompt when no options", () => {
		const prompt = buildReportAgentPrompt();
		expect(prompt).toBe(REPORT_AGENT_PROMPT);
	});
});

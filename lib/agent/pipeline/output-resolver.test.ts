import { resolveReportOutput } from "./output-resolver";

describe("resolveReportOutput", () => {
	it("extracts markdown content from a fenced code block", () => {
		const output = resolveReportOutput({
			text: `Here is the report:

\`\`\`markdown
# Report

## Summary
This is the analysis.
\`\`\``,
			toolErrors: [],
			toolResults: [],
		});

		expect(output.markdownContent).toContain("# Report");
		expect(output.markdownContent).toContain("## Summary");
	});

	it("throws when no markdown code block is found", () => {
		expect(() =>
			resolveReportOutput({
				text: "No report here",
				toolErrors: [],
				toolResults: [],
			}),
		).toThrow("Report step did not produce markdown content.");
	});
});

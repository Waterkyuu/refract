import { resolveReportOutput } from "./output-resolver";

describe("resolveReportOutput", () => {
	it("normalizes Typst report text settings before returning content", () => {
		const output = resolveReportOutput({
			text: `Here is the report:

\`\`\`typst
#set text(
  font: ("Noto Serif CJK SC", "SimSun"),
  lang: "zh",
)

= Report
\`\`\``,
			toolErrors: [],
			toolResults: [],
		});

		expect(output.typstContent).toContain("fallback: true");
		expect(output.typstContent).not.toContain("fallback: false");
	});
});

import { ensureTypstTextFallback } from "./text-fallback";

const DEFAULT_TEXT_SET = `#set text(
  font: ("New Computer Modern", "SimSun", "PingFang SC", "Microsoft YaHei"),
  lang: "zh",
  fallback: true,
)`;

describe("ensureTypstTextFallback", () => {
	it("prepends the default text set when Typst has no text font setting", () => {
		const result = ensureTypstTextFallback("= Report\n\n中文内容");

		expect(result).toBe(`${DEFAULT_TEXT_SET}\n\n= Report\n\n中文内容`);
	});

	it("adds fallback true to an existing text font setting", () => {
		const result = ensureTypstTextFallback(`#set text(
  font: ("Noto Serif CJK SC", "SimSun"),
  lang: "zh",
)

= Report`);

		expect(result).toBe(`#set text(
  font: ("Noto Serif CJK SC", "SimSun"),
  lang: "zh",
  fallback: true,
)

= Report`);
	});

	it("replaces an existing false fallback in a text font setting", () => {
		const result = ensureTypstTextFallback(`#set text(
  font: "SimSun",
  fallback: false,
)

= Report`);

		expect(result).toBe(`#set text(
  font: "SimSun",
  fallback: true,
)

= Report`);
	});

	it("does not duplicate an existing true fallback", () => {
		const input = `#set text(
  font: ("New Computer Modern", "SimSun"),
  fallback: true,
)

= Report`;

		expect(ensureTypstTextFallback(input)).toBe(input);
	});
});

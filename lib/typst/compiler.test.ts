/**
 * @jest-environment node
 */

import { createTypstCompiler } from "./compiler";

describe("compileTypst", () => {
	it("compiles valid Typst content to SVG", async () => {
		const compileTypst = createTypstCompiler({
			svg: async ({ mainContent }) => `<svg>${mainContent}</svg>`,
		});

		const result = await compileTypst("= Hello\n\nThis is *Typst*.");

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error(result.error);
		}
		expect(result.svg).toContain("<svg");
	});

	it("returns diagnostics for invalid Typst content", async () => {
		const compileTypst = createTypstCompiler({
			svg: async () => {
				throw new Error("unclosed delimiter");
			},
		});

		const result = await compileTypst("= Broken\n\n#unknown-function(");

		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("Expected Typst compilation to fail.");
		}
		expect(result.error).toContain("unclosed delimiter");
		expect(result.diagnostics).toContain("unclosed delimiter");
	});
});

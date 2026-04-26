import {
	buildLearnMemoryPrompt,
	formatLearnMemoryPrompt,
} from "./learn-memories";

describe("learn memories", () => {
	it("formats learned memories as a prompt section", () => {
		const prompt = formatLearnMemoryPrompt("typst", [
			{
				title: "Inline math spacing",
				content: "Use `$x^2$` for inline math, not `$ x^2 $`.",
			},
			{
				title: "Typst bold syntax",
				content: "Use `*important*` for bold text in Typst.",
			},
		]);

		expect(prompt).toContain("## Learned typst corrections");
		expect(prompt).toContain("1. Inline math spacing");
		expect(prompt).toContain("Use `$x^2$` for inline math");
		expect(prompt).toContain("2. Typst bold syntax");
	});

	it("returns an empty prompt when there are no memories", () => {
		expect(formatLearnMemoryPrompt("typst", [])).toBe("");
	});

	it("reads memories by type with a default prompt limit", async () => {
		const readMemories = jest.fn(async () => [
			{
				title: "Inline math spacing",
				content: "Use `$x^2$` for inline math.",
			},
		]);

		const prompt = await buildLearnMemoryPrompt("typst", { readMemories });

		expect(readMemories).toHaveBeenCalledWith("typst", 20);
		expect(prompt).toContain("Inline math spacing");
	});
});

import { canonicalizeSteps, parsePlanFromText } from "./orchestrator";

describe("parsePlanFromText", () => {
	const validJson = JSON.stringify({
		steps: ["data", "chart", "report"],
		reasoning: "full analysis requested",
		dataGoal: "clean and summarize",
		chartGoal: "bar chart",
		reportGoal: "summary report",
	});

	it("parses a valid JSON response", () => {
		const result = parsePlanFromText(validJson);
		expect(result.steps).toEqual(["data", "chart", "report"]);
		expect(result.reasoning).toBe("full analysis requested");
		expect(result.dataGoal).toBe("clean and summarize");
	});

	it("extracts JSON embedded in surrounding text", () => {
		const text = `Here is the plan:\n${validJson}\nHope this helps!`;
		const result = parsePlanFromText(text);
		expect(result.steps).toEqual(["data", "chart", "report"]);
	});

	it("returns empty steps when no JSON object found", () => {
		const result = parsePlanFromText("no json here");
		expect(result.steps).toEqual([]);
		expect(result.reasoning).toBe(
			"Could not parse plan from orchestrator response",
		);
	});

	it("returns empty steps when steps is not an array", () => {
		const result = parsePlanFromText(
			'{"steps": "not-array", "reasoning": "x"}',
		);
		expect(result.steps).toEqual([]);
		expect(result.reasoning).toBe("Invalid plan: steps is not an array");
	});

	it("returns empty steps when JSON is malformed", () => {
		const result = parsePlanFromText('{"steps": [broken json');
		expect(result.steps).toEqual([]);
		expect(result.reasoning).toBe("Failed to parse plan JSON");
	});

	it("filters out invalid step values", () => {
		const input = JSON.stringify({
			steps: ["data", "invalid", "chart"],
			reasoning: "mixed",
		});
		const result = parsePlanFromText(input);
		expect(result.steps).toEqual(["data", "chart"]);
	});

	it("preserves optional goal fields", () => {
		const input = JSON.stringify({
			steps: ["data"],
			reasoning: "inspect only",
			dataGoal: "load csv",
		});
		const result = parsePlanFromText(input);
		expect(result.dataGoal).toBe("load csv");
		expect(result.chartGoal).toBeUndefined();
	});

	it("handles empty steps array from valid JSON", () => {
		const input = JSON.stringify({
			steps: [],
			reasoning: "unrelated request",
		});
		const result = parsePlanFromText(input);
		expect(result.steps).toEqual([]);
		expect(result.reasoning).toBe("unrelated request");
	});

	it("handles JSON wrapped in markdown code block", () => {
		const text = `\`\`\`json\n${validJson}\n\`\`\``;
		const result = parsePlanFromText(text);
		expect(result.steps).toEqual(["data", "chart", "report"]);
	});

	it("canonicalizes out-of-order steps and adds dependencies", () => {
		const input = JSON.stringify({
			steps: ["report", "chart"],
			reasoning: "want charts and a write-up",
		});
		const result = parsePlanFromText(input);
		expect(result.steps).toEqual(["data", "chart", "report"]);
	});

	it("deduplicates repeated steps", () => {
		expect(canonicalizeSteps(["data", "chart", "data", "report"])).toEqual([
			"data",
			"chart",
			"report",
		]);
	});
});

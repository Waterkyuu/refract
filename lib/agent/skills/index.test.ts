import { findSkill, getSkillList, getSkills } from "./index";

describe("skill loader", () => {
	it("loads all skills from disk", () => {
		const skills = getSkills();
		expect(skills).toHaveLength(4);

		const names = skills.map((s) => s.name).sort();
		expect(names).toEqual([
			"paper-expert",
			"report-expert",
			"resume-expert",
			"typst-expert",
		]);
	});

	it("each skill has non-empty name, description and content", () => {
		for (const skill of getSkills()) {
			expect(skill.name).toBeTruthy();
			expect(skill.description).toBeTruthy();
			expect(skill.content).toBeTruthy();
		}
	});

	it("findSkill returns the correct skill by name", () => {
		const typst = findSkill("typst-expert");
		expect(typst).toBeDefined();
		expect(typst?.name).toBe("typst-expert");
		expect(typst?.content).toContain("#set page");
		expect(typst?.content).toContain("Typst is **not** LaTeX");

		const paper = findSkill("paper-expert");
		expect(paper).toBeDefined();
		expect(paper?.content).toContain("graceful-genetics");

		const report = findSkill("report-expert");
		expect(report).toBeDefined();
		expect(report?.content).toContain("obsidius");

		const resume = findSkill("resume-expert");
		expect(resume).toBeDefined();
		expect(resume?.content).toContain("Jane Doe");
	});

	it("findSkill returns undefined for unknown skill", () => {
		expect(findSkill("nonexistent-skill")).toBeUndefined();
	});

	it("getSkillList formats skills as markdown bullet list", () => {
		const list = getSkillList();
		expect(list).toContain("- **typst-expert**:");
		expect(list).toContain("- **paper-expert**:");
		expect(list).toContain("- **report-expert**:");
		expect(list).toContain("- **resume-expert**:");

		const lines = list.split("\n");
		expect(lines).toHaveLength(4);
	});
});

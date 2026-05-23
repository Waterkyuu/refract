import { findSkill, getSkillList, getSkills } from "./index";

describe("skill loader", () => {
	it("loads all skills from disk", () => {
		const skills = getSkills();
		expect(skills).toHaveLength(2);

		const names = skills.map((s) => s.name).sort();
		expect(names).toEqual(["markdown-author", "markdown-report"]);
	});

	it("each skill has non-empty name, description and content", () => {
		for (const skill of getSkills()) {
			expect(skill.name).toBeTruthy();
			expect(skill.description).toBeTruthy();
			expect(skill.content).toBeTruthy();
		}
	});

	it("findSkill returns the correct skill by name", () => {
		const author = findSkill("markdown-author");
		expect(author).toBeDefined();
		expect(author?.name).toBe("markdown-author");
		expect(author?.content).toContain("Badge");

		const report = findSkill("markdown-report");
		expect(report).toBeDefined();
		expect(report?.name).toBe("markdown-report");
	});

	it("findSkill returns undefined for unknown skill", () => {
		expect(findSkill("nonexistent-skill")).toBeUndefined();
	});

	it("getSkillList formats skills as markdown bullet list", () => {
		const list = getSkillList();
		expect(list).toContain("- **markdown-author**:");
		expect(list).toContain("- **markdown-report**:");

		const lines = list.split("\n");
		expect(lines).toHaveLength(2);
	});
});

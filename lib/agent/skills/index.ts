import fs from "node:fs";
import path from "node:path";

type Skill = {
	name: string;
	description: string;
	content: string;
};

const parseFrontmatter = (
	raw: string,
): { name: string; description: string; content: string } => {
	const lines = raw.split("\n");

	// Only parse YAML-like frontmatter when the file starts with a fence.
	if (lines.length < 2 || lines[0]?.trim() !== "---") {
		return { name: "", description: "", content: raw };
	}

	let end = -1;
	for (let i = 1; i < lines.length; i++) {
		if (lines[i]?.trim() === "---") {
			end = i;
			break;
		}
	}

	if (end === -1) {
		return { name: "", description: "", content: raw };
	}

	const fmLines = lines.slice(1, end);
	let name = "";
	let description = "";

	for (const line of fmLines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("name:")) {
			name = trimmed
				.slice("name:".length)
				.trim()
				.replace(/^["'`]|["'`]$/g, "");
		} else if (trimmed.startsWith("description:")) {
			description = trimmed
				.slice("description:".length)
				.trim()
				.replace(/^["'`]|["'`]$/g, "");
		}
	}

	const content = lines.slice(end + 1).join("\n");
	return { name, description, content };
};

const loadAllSkills = (): Skill[] => {
	const skillsDir = path.join(process.cwd(), "lib", "agent", "skills");

	if (!fs.existsSync(skillsDir)) {
		return [];
	}

	const skills: Skill[] = [];
	const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
		if (!fs.existsSync(skillFile)) continue;

		const raw = fs.readFileSync(skillFile, "utf-8");
		const parsed = parseFrontmatter(raw);
		const skillName = parsed.name || entry.name;

		skills.push({
			name: skillName,
			description: parsed.description,
			content: parsed.content,
		});
	}

	return skills;
};

let cachedSkills: Skill[] | null = null;

const getSkills = (): Skill[] => {
	// Cache skill files in-process to avoid repeated disk I/O on every tool call.
	if (!cachedSkills) {
		cachedSkills = loadAllSkills();
	}
	return cachedSkills;
};

const findSkill = (name: string): Skill | undefined =>
	getSkills().find((s) => s.name === name);

const getSkillList = (): string =>
	getSkills()
		.map((s) => `- **${s.name}**: ${s.description}`)
		.join("\n");

export type { Skill };
export { findSkill, getSkillList, getSkills };

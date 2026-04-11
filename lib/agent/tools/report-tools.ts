import { findSkill, getSkills } from "@/lib/agent/skills";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import { createCodeInterpreterTool, createPersistCodeFileTool } from "./shared";

const createLoadSkillTool = () =>
	tool({
		description:
			"Load the full content of a skill into the agent's context. Use this when you need detailed information about handling a specific type of request.",
		inputSchema: zodSchema(
			z.object({
				skill_name: z.string().describe("The name of the skill to load"),
			}),
		),
		execute: async ({ skill_name }: { skill_name: string }) => {
			const skill = findSkill(skill_name);
			if (skill) {
				return `Loaded skill: ${skill.name}\n\n${skill.content}`;
			}
			const available = getSkills()
				.map((s) => s.name)
				.join(", ");
			return `Skill '${skill_name}' not found. Available skills: ${available}`;
		},
	});

const createReportTools = () => ({
	codeInterpreter: createCodeInterpreterTool({ fileIds: [] }),
	persistCodeFile: createPersistCodeFileTool(),
	loadSkill: createLoadSkillTool(),
});

export { createReportTools };

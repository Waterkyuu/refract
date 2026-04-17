import { findSkill, getSkills } from "@/lib/agent/skills";
import type { SandboxSession } from "@/lib/e2b";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import {
	createCodeInterpreterTool,
	createPersistCodeFileTool,
	createPersistLatestChartTool,
} from "./tools/shared";

type CreateChatToolsOptions = {
	fileIds?: string[];
	sandboxSession: SandboxSession;
};

const createSandboxTool = (sandboxSession: SandboxSession) =>
	tool({
		description:
			"Create an E2B Desktop Sandbox with a full Ubuntu desktop and browser. Returns a VNC URL for viewing the remote desktop. Use this when the user needs browser automation or visual desktop interaction.",
		inputSchema: zodSchema(
			z.object({
				task: z
					.string()
					.describe("Description of what the agent needs to do in the sandbox"),
			}),
		),
		execute: async ({ task }: { task: string }) => {
			const { sandboxId, vncUrl } = await sandboxSession.createDesktopSandbox();

			return {
				sandboxId,
				vncUrl,
				status: "running" as const,
				message: `Sandbox created for task: ${task}`,
			};
		},
	});

const executeShellTool = (sandboxSession: SandboxSession) =>
	tool({
		description:
			"Execute a shell command in the desktop sandbox. IMPORTANT: You MUST call createSandbox before using this tool, otherwise it will fail.",
		inputSchema: zodSchema(
			z.object({
				command: z.string().describe("Shell command to execute in the sandbox"),
			}),
		),
		execute: async ({ command }: { command: string }) => {
			const result = await sandboxSession.executeCommand(command);

			return {
				status: "success" as const,
				stdout: result.stdout,
				stderr: result.stderr,
				exitCode: result.exitCode,
			};
		},
	});

const navigateBrowserTool = (sandboxSession: SandboxSession) =>
	tool({
		description:
			"Open a URL in the desktop sandbox browser. IMPORTANT: You MUST call createSandbox before using this tool, otherwise it will fail.",
		inputSchema: zodSchema(
			z.object({
				url: z.string().describe("URL to navigate to"),
			}),
		),
		execute: async ({ url }: { url: string }) => {
			const result = await sandboxSession.navigateBrowser(url);

			return {
				status: "success" as const,
				url: result.url,
				message: result.title,
			};
		},
	});

const searchWebTool = (sandboxSession: SandboxSession) =>
	tool({
		description:
			"Search the web by opening Google in the desktop sandbox browser. IMPORTANT: You MUST call createSandbox before using this tool, otherwise it will fail.",
		inputSchema: zodSchema(
			z.object({
				query: z.string().describe("Search query"),
			}),
		),
		execute: async ({ query }: { query: string }) => {
			const result = await sandboxSession.searchWeb(query);

			return {
				status: "success" as const,
				query: result.query,
				results: result.results,
			};
		},
	});

const loadSkillTool = tool({
	description:
		"Load the full content of a skill into the agent's context. Use this when you need detailed information about how to handle a specific type of request (e.g., creating a paper, resume, or notes with Typst). This will provide you with comprehensive instructions, templates, and guidelines for the skill area.",
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
			.map((skillItem) => skillItem.name)
			.join(", ");
		return `Skill '${skill_name}' not found. Available skills: ${available}`;
	},
});

const createChatTools = ({
	fileIds = [],
	sandboxSession,
}: CreateChatToolsOptions) => ({
	createSandbox: createSandboxTool(sandboxSession),
	codeInterpreter: createCodeInterpreterTool({ fileIds, sandboxSession }),
	executeShell: executeShellTool(sandboxSession),
	loadSkill: loadSkillTool,
	navigateBrowser: navigateBrowserTool(sandboxSession),
	persistCodeFile: createPersistCodeFileTool(sandboxSession),
	persistLatestChart: createPersistLatestChartTool(sandboxSession),
	searchWeb: searchWebTool(sandboxSession),
});

export {
	createChatTools,
	createSandboxTool,
	executeShellTool,
	loadSkillTool,
	navigateBrowserTool,
	searchWebTool,
};

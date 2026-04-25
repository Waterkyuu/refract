import type { SandboxSession } from "@/lib/agent/sandbox/e2b";
import {
	createCodeInterpreterTool,
	createPersistAllChartsTool,
	createPersistCodeFileTool,
} from "@/lib/agent/tools/shared";
import { createLoadSkillTool } from "@/lib/agent/tools/skill-tools";
import { tool, zodSchema } from "ai";
import { z } from "zod";

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

const loadSkillTool = createLoadSkillTool(
	"Load the full content of a skill into the agent's context. Use this when you need detailed information about how to handle a specific type of request (e.g., creating a paper, resume, or notes with Typst). This will provide you with comprehensive instructions, templates, and guidelines for the skill area.",
);

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
	persistAllCharts: createPersistAllChartsTool(sandboxSession),
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

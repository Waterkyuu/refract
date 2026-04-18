import { executePipeline } from "@/lib/agent/pipeline/executor";
import { createSandboxSession } from "@/lib/agent/sandbox/e2b";
import { buildChatSystemPrompt } from "@/lib/agent/single-agent/prompt";
import { createChatTools } from "@/lib/agent/single-agent/tools";
import { readFileRecord } from "@/lib/file-store";
import type { FileRecord } from "@/types";
import type { PipelineStreamEvent } from "@/types/agent";
import {
	type UIMessage,
	convertToModelMessages,
	stepCountIs,
	streamText,
} from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { zhipu } from "zhipu-ai-provider";

type ChatRequestBody = {
	fileIds?: string[];
	messages: Array<Omit<UIMessage, "id">>;
	mode?: "pipeline" | "single";
};

const resolveAttachedFiles = async (
	fileIds: string[],
): Promise<FileRecord[]> => {
	const attachedFiles = await Promise.all(
		fileIds.map(async (fileId) => {
			try {
				return await readFileRecord(fileId);
			} catch {
				return null;
			}
		}),
	);

	return attachedFiles.filter((file): file is FileRecord => file !== null);
};

const extractMessageText = (message: Omit<UIMessage, "id">): string =>
	message.parts
		.flatMap((part) => {
			if (part.type === "text") {
				return [part.text];
			}

			if (part.type === "reasoning") {
				return [part.text];
			}

			return [];
		})
		.join("\n")
		.trim();

const buildPipelineRequest = (
	uiMessages: Array<Omit<UIMessage, "id">>,
): string =>
	uiMessages
		.map((message) => {
			const content = extractMessageText(message);
			if (!content) {
				return null;
			}

			return `${message.role === "assistant" ? "Assistant" : "User"}:\n${content}`;
		})
		.filter((chunk): chunk is string => chunk !== null)
		.join("\n\n");

const handlePipelineMode = async (
	fileIds: string[],
	uiMessages: Array<Omit<UIMessage, "id">>,
) => {
	const attachedFiles = await resolveAttachedFiles(fileIds);
	const pipelineRequest = buildPipelineRequest(uiMessages);

	if (!pipelineRequest) {
		return NextResponse.json(
			{ code: 400, success: false, message: "No user message found" },
			{ status: 400 },
		);
	}

	const encoder = new TextEncoder();
	const sandboxSession = createSandboxSession();

	const stream = new ReadableStream({
		async start(controller) {
			const send = (event: PipelineStreamEvent) => {
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({ type: "pipeline-event", event })}\n\n`,
					),
				);
			};

			try {
				await executePipeline(
					pipelineRequest,
					attachedFiles,
					fileIds,
					sandboxSession,
					{
						onEvent: send,
					},
				);
			} catch (error) {
				send({
					type: "step-error",
					step: "data",
					error: error instanceof Error ? error.message : "Pipeline failed",
				});
			} finally {
				await sandboxSession.cleanup();
				controller.close();
			}
		},
		cancel: async () => {
			await sandboxSession.cleanup();
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
};

const handleSingleMode = async (
	fileIds: string[],
	uiMessages: Array<Omit<UIMessage, "id">>,
) => {
	const attachedFiles = await resolveAttachedFiles(fileIds);
	const modelMessages = await convertToModelMessages(uiMessages);
	const modelName = process.env.GLM_MODEL ?? "glm-4.7";
	const sandboxSession = createSandboxSession();

	const result = streamText({
		model: zhipu(modelName),
		system: buildChatSystemPrompt(attachedFiles),
		messages: modelMessages,
		tools: createChatTools({ fileIds, sandboxSession }),
		stopWhen: stepCountIs(10),
		onAbort: async () => {
			await sandboxSession.cleanup();
		},
		onError: async () => {
			await sandboxSession.cleanup();
		},
		onFinish: async () => {
			await sandboxSession.cleanup();
		},
	});

	return result.toUIMessageStreamResponse();
};

const POST = async (req: NextRequest) => {
	try {
		const body = await req.json();
		const {
			fileIds = [],
			messages: uiMessages,
			mode = "pipeline",
		}: ChatRequestBody = body;

		if (mode === "pipeline") {
			return handlePipelineMode(fileIds, uiMessages);
		}

		return handleSingleMode(fileIds, uiMessages);
	} catch (error) {
		console.error("[Chat API Error]", error);
		return NextResponse.json(
			{
				code: 500,
				success: false,
				message:
					error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
};

export { POST };

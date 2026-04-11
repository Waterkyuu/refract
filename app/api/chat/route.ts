import type { PipelineStreamEvent } from "@/lib/agent/agents/types";
import { executePipeline } from "@/lib/agent/pipeline/executor";
import { readFileRecord } from "@/lib/file-store";
import type { FileRecord } from "@/types";
import {
	type UIMessage,
	convertToModelMessages,
	stepCountIs,
	streamText,
} from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { zhipu } from "zhipu-ai-provider";

import { buildChatSystemPrompt } from "@/lib/agent/prompts";
import { createChatTools } from "@/lib/agent/tools";

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

const handlePipelineMode = async (
	req: NextRequest,
	fileIds: string[],
	uiMessages: Array<Omit<UIMessage, "id">>,
) => {
	const attachedFiles = await resolveAttachedFiles(fileIds);
	const modelMessages = await convertToModelMessages(uiMessages);
	const lastUserMessage = modelMessages.at(-1)?.content;

	if (!lastUserMessage || typeof lastUserMessage !== "string") {
		return NextResponse.json(
			{ code: 400, success: false, message: "No user message found" },
			{ status: 400 },
		);
	}

	const encoder = new TextEncoder();

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
				await executePipeline(lastUserMessage, attachedFiles, fileIds, {
					onEvent: send,
				});
			} catch (error) {
				send({
					type: "step-error",
					step: "data",
					error: error instanceof Error ? error.message : "Pipeline failed",
				});
			}

			controller.close();
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

	const result = streamText({
		model: zhipu(modelName),
		system: buildChatSystemPrompt(attachedFiles),
		messages: modelMessages,
		tools: createChatTools({ fileIds }),
		stopWhen: stepCountIs(10),
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
			return handlePipelineMode(req, fileIds, uiMessages);
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

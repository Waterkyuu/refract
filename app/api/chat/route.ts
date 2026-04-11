import { buildChatSystemPrompt } from "@/lib/agent/prompts";
import { createChatTools } from "@/lib/agent/tools";
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

type ChatRequestBody = {
	fileIds?: string[];
	messages: Array<Omit<UIMessage, "id">>;
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

const POST = async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { fileIds = [], messages: uiMessages }: ChatRequestBody = body;

		const attachedFiles = await resolveAttachedFiles(fileIds);
		const modelMessages = await convertToModelMessages(uiMessages);
		const modelName = process.env.GLM_MODEL ?? "glm-4.5";

		const result = streamText({
			model: zhipu(modelName),
			system: buildChatSystemPrompt(attachedFiles),
			messages: modelMessages,
			tools: createChatTools({ fileIds }),
			stopWhen: stepCountIs(10),
		});

		return result.toUIMessageStreamResponse();
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

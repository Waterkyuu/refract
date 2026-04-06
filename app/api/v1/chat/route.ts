import { streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { zhipu } from "zhipu-ai-provider";

const finalSystemPrompt = "";

export const POST = async (req: NextRequest) => {
	const { messages } = await req.json();

	const model = process.env.GLM_MODLE || "glm-4-flash";

	if (!messages || messages.length === 0) {
		return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
	}

	try {
		const result = streamText({
			model: zhipu(model as Parameters<typeof zhipu>[0]),
			system: finalSystemPrompt,
			messages,
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("Failed to call prompt robot", error);
		return NextResponse.json({ error: error }, { status: 500 });
	}
};

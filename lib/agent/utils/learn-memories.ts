import { learnMemories } from "@/infra/schema/learn-memories";
import { desc, eq } from "drizzle-orm";

const DEFAULT_LEARN_MEMORY_LIMIT = 20;

type LearnMemoryPromptItem = {
	title: string;
	content: string;
};

type LearnMemoryReader = (
	type: string,
	limit: number,
) => Promise<LearnMemoryPromptItem[]>;

type BuildLearnMemoryPromptOptions = {
	limit?: number;
	readMemories?: LearnMemoryReader;
};

const readLearnMemoriesByType: LearnMemoryReader = async (type, limit) => {
	const { db } = await import("@/infra/drizzle");
	const rows = await db
		.select({
			title: learnMemories.title,
			content: learnMemories.content,
		})
		.from(learnMemories)
		.where(eq(learnMemories.type, type))
		.orderBy(desc(learnMemories.usageCount), desc(learnMemories.updatedAt))
		.limit(limit);

	return rows;
};

const formatLearnMemoryPrompt = (
	type: string,
	memories: LearnMemoryPromptItem[],
): string => {
	if (memories.length === 0) {
		return "";
	}

	const lines = memories.map(
		({ content, title }, index) => `${index + 1}. ${title}\n${content}`,
	);

	return `## Learned ${type} corrections\n${lines.join("\n\n")}`;
};

const buildLearnMemoryPrompt = async (
	type: string,
	options: BuildLearnMemoryPromptOptions = {},
): Promise<string> => {
	const limit = options.limit ?? DEFAULT_LEARN_MEMORY_LIMIT;
	const readMemories = options.readMemories ?? readLearnMemoriesByType;
	const memories = await readMemories(type, limit);

	return formatLearnMemoryPrompt(type, memories);
};

export {
	DEFAULT_LEARN_MEMORY_LIMIT,
	buildLearnMemoryPrompt,
	formatLearnMemoryPrompt,
	readLearnMemoriesByType,
};
export type {
	BuildLearnMemoryPromptOptions,
	LearnMemoryPromptItem,
	LearnMemoryReader,
};

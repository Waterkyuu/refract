import { z } from "zod";

import { ToolCallEventSchema } from "./agent";

const ChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

const ChatMessageSchema = z.object({
	id: z.string(),
	role: ChatMessageRoleSchema,
	content: z.string(),
	createdAt: z.number(),
	toolEventIds: z.array(z.string()).default([]),
});

const ChatSessionSchema = z.object({
	id: z.string(),
	title: z.string(),
	updatedAt: z.number(),
	lastMessagePreview: z.string(),
	vncUrl: z.string().nullable().default(null),
	events: z.array(ToolCallEventSchema).default([]),
	messages: z.array(ChatMessageSchema).default([]),
});

const ChatSessionSummarySchema = ChatSessionSchema.pick({
	id: true,
	title: true,
	updatedAt: true,
	lastMessagePreview: true,
	vncUrl: true,
}).extend({
	messageCount: z.number().int().nonnegative(),
	eventCount: z.number().int().nonnegative(),
});

const MessagesSchema = z.array(ChatMessageSchema);
const SessionsSchema = z.array(ChatSessionSummarySchema);

type ChatMessage = z.infer<typeof ChatMessageSchema>;
type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;
type ChatSession = z.infer<typeof ChatSessionSchema>;
type ChatSessionSummary = z.infer<typeof ChatSessionSummarySchema>;
type Messages = z.infer<typeof MessagesSchema>;
type Sessions = z.infer<typeof SessionsSchema>;

export {
	ChatMessageRoleSchema,
	ChatMessageSchema,
	ChatSessionSchema,
	ChatSessionSummarySchema,
	MessagesSchema,
	SessionsSchema,
	type ChatMessage,
	type ChatMessageRole,
	type ChatSession,
	type ChatSessionSummary,
	type Messages,
	type Sessions,
};

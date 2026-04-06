import { z } from "zod";

// Agent execution status
type AgentStatus = "idle" | "thinking" | "acting" | "completed" | "error";

// Tool call event for debug panel event stream
type ToolCallEvent = {
	id: string;
	toolCallId: string;
	toolName: string;
	args: Record<string, unknown>;
	state: "call" | "partial-call" | "result";
	result?: unknown;
	startedAt: number;
	finishedAt?: number;
	durationMs?: number;
};

// Chat session schema (used by sidebar / history management)
const SessionItemSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	title: z.string(),
	updatedAt: z.coerce.date(),
	createdAt: z.coerce.date(),
});

const SessionsSchema = z.array(SessionItemSchema);

type SessionItem = z.infer<typeof SessionItemSchema>;
type Sessions = SessionItem[];

export {
	SessionItemSchema,
	SessionsSchema,
	type AgentStatus,
	type ToolCallEvent,
	type SessionItem,
	type Sessions,
};

import { z } from "zod";

const ToolCallEventTypeSchema = z.enum([
	"search",
	"click",
	"type",
	"scroll",
	"navigate",
	"system",
]);

const ToolCallEventStatusSchema = z.enum(["pending", "success", "error"]);
const AgentStatusSchema = z.enum(["idle", "running", "error"]);

const ToolCallEventSchema = z.object({
	id: z.string(),
	timestamp: z.number().int(),
	type: ToolCallEventTypeSchema,
	payload: z.record(z.string(), z.unknown()),
	status: ToolCallEventStatusSchema,
	duration: z.number().int().nonnegative().optional(),
	summary: z.string().optional(),
});

const AgentStatsSchema = z.object({
	click: z.number().int().nonnegative(),
	type: z.number().int().nonnegative(),
	scroll: z.number().int().nonnegative(),
});

const AgentStateSchema = z.object({
	status: AgentStatusSchema,
	events: z.array(ToolCallEventSchema),
	stats: AgentStatsSchema,
	vncUrl: z.string().nullable(),
});

type ToolCallEventType = z.infer<typeof ToolCallEventTypeSchema>;
type ToolCallEventStatus = z.infer<typeof ToolCallEventStatusSchema>;
type ToolCallEvent = z.infer<typeof ToolCallEventSchema>;
type AgentStatus = z.infer<typeof AgentStatusSchema>;
type AgentStats = z.infer<typeof AgentStatsSchema>;
type AgentState = z.infer<typeof AgentStateSchema>;

export {
	AgentStatusSchema,
	AgentStateSchema,
	AgentStatsSchema,
	ToolCallEventSchema,
	ToolCallEventStatusSchema,
	ToolCallEventTypeSchema,
	type AgentState,
	type AgentStats,
	type AgentStatus,
	type ToolCallEvent,
	type ToolCallEventStatus,
	type ToolCallEventType,
};

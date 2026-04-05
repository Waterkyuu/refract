import { buildToolCallEvent } from "@/lib/agent-events";
import type { AgentStatus, ToolCallEvent, ToolCallEventType } from "@/types";

type SandboxSession = {
	id: string;
	vncUrl: string;
	provider: "mock-e2b-desktop";
};

type RuntimeCallbacks = {
	onStatusChange?: (status: AgentStatus) => void;
	onToolEvent?: (event: ToolCallEvent) => void;
	onVncUrl?: (url: string) => void;
	delayMs?: number;
};

type RuntimeResult = {
	assistantMessage: string;
	eventIds: string[];
	sandbox: SandboxSession;
};

type ToolBlueprint = {
	type: ToolCallEventType;
	payload: Record<string, unknown>;
};

const wait = async (delayMs: number) => {
	if (delayMs <= 0) {
		return;
	}

	await new Promise((resolve) => {
		setTimeout(resolve, delayMs);
	});
};

const createId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `agent-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const extractSearchTarget = (prompt: string) => {
	const matchedTarget = prompt.match(/search\s+(.+)/i)?.[1]?.trim();
	return matchedTarget && matchedTarget.length > 0
		? matchedTarget.replace(/[.。]$/, "")
		: "chatgpt.com";
};

const createMockSandboxSession = async (): Promise<SandboxSession> => {
	const id = createId().slice(0, 12);

	return {
		id,
		vncUrl: `https://8080-${id}.e2b.dev`,
		provider: "mock-e2b-desktop",
	};
};

const createToolPlan = (prompt: string): ToolBlueprint[] => {
	const target = extractSearchTarget(prompt);

	return [
		{
			type: "navigate",
			payload: {
				url: "https://www.google.com",
			},
		},
		{
			type: "search",
			payload: {
				engine: "google",
				query: target,
			},
		},
		{
			type: "type",
			payload: {
				selector: "textarea[name='q']",
				text: target,
			},
		},
		{
			type: "click",
			payload: {
				selector: "button[type='submit']",
				label: "Google Search",
			},
		},
		{
			type: "system",
			payload: {
				message: `Observed search results for ${target}`,
			},
		},
	];
};

const createAssistantSummary = (prompt: string) => {
	const target = extractSearchTarget(prompt);

	return `I opened a browser sandbox, searched for ${target}, and kept the live desktop stream ready in the VNC panel.`;
};

const runMockAgentTurn = async (
	prompt: string,
	callbacks: RuntimeCallbacks = {},
): Promise<RuntimeResult> => {
	const { onStatusChange, onToolEvent, onVncUrl, delayMs = 120 } = callbacks;
	const sandbox = await createMockSandboxSession();
	const toolPlan = createToolPlan(prompt);
	const eventIds: string[] = [];

	onStatusChange?.("running");
	onVncUrl?.(sandbox.vncUrl);

	for (const blueprint of toolPlan) {
		const startedAt = Date.now();
		const id = createId();
		const pendingEvent = buildToolCallEvent({
			id,
			timestamp: startedAt,
			type: blueprint.type,
			payload: blueprint.payload,
			status: "pending",
		});

		eventIds.push(id);
		onToolEvent?.(pendingEvent);

		await wait(delayMs);

		onToolEvent?.(
			buildToolCallEvent({
				...pendingEvent,
				status: "success",
				duration: Date.now() - startedAt,
			}),
		);
	}

	onStatusChange?.("idle");

	return {
		assistantMessage: createAssistantSummary(prompt),
		eventIds,
		sandbox,
	};
};

export { runMockAgentTurn, type RuntimeCallbacks, type RuntimeResult };

import type { AgentStatus, ToolCallEvent } from "@/types/chat";
import { atom } from "jotai";

const firstUserInputAtom = atom<string>("");

const vncUrlAtom = atom<string>("");

const agentStatusAtom = atom<AgentStatus>("idle");

const toolEventsAtom = atom<ToolCallEvent[]>([]);

const dispatchToolEventAtom = atom(null, (get, set, event: ToolCallEvent) => {
	const prev = get(toolEventsAtom);
	const existing = prev.findIndex((e) => e.toolCallId === event.toolCallId);
	if (existing >= 0) {
		const updated = [...prev];
		updated[existing] = { ...updated[existing], ...event };
		set(toolEventsAtom, updated);
	} else {
		set(toolEventsAtom, [...prev, event]);
	}
});

const clearToolEventsAtom = atom(null, (_get, set) => {
	set(toolEventsAtom, []);
});

export {
	firstUserInputAtom,
	vncUrlAtom,
	agentStatusAtom,
	toolEventsAtom,
	dispatchToolEventAtom,
	clearToolEventsAtom,
};

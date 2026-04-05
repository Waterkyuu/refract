import { atom } from "jotai";

import { createInitialAgentState, reduceAgentState } from "@/lib/agent-events";
import type { AgentAction } from "@/lib/agent-events";
import type { AgentState } from "@/types";

const agentStateAtom = atom<AgentState>(createInitialAgentState());

const agentDispatchAtom = atom(null, (get, set, action: AgentAction) => {
	set(agentStateAtom, reduceAgentState(get(agentStateAtom), action));
});

export { agentDispatchAtom, agentStateAtom };

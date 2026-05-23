import {
	EMPTY_WORKSPACE_SNAPSHOT,
	type WorkspaceSnapshot,
	cloneWorkspaceSnapshot,
} from "@/lib/chat/workspace-hydration";
import type { WorkspaceChart, WorkspaceDataset, WorkspaceFile } from "@/types";
import type { AgentStatus, ChatAttachment, ToolCallEvent } from "@/types/chat";
import { atom } from "jotai";
import type { Getter, Setter } from "jotai/vanilla";

const firstUserInputAtom = atom<string>("");

const pendingHomePromptAtom = atom<string>("");

const pendingHomeUploadsAtom = atom<ChatAttachment[]>([]);

type WorkspaceBySessionState = Record<string, WorkspaceSnapshot>;
type WorkspaceHydratingBySessionState = Record<string, boolean>;

const DEFAULT_WORKSPACE_SESSION_ID = "__global__";
const activeWorkspaceSessionIdAtom = atom<string>(DEFAULT_WORKSPACE_SESSION_ID);
const workspaceBySessionAtom = atom<WorkspaceBySessionState>({});
const workspaceHydratingBySessionAtom = atom<WorkspaceHydratingBySessionState>(
	{},
);

const getWorkspaceSnapshotForSession = (
	state: WorkspaceBySessionState,
	sessionId: string,
): WorkspaceSnapshot => {
	const targetSessionId = sessionId || DEFAULT_WORKSPACE_SESSION_ID;

	const sessionWorkspace = state[targetSessionId];
	if (!sessionWorkspace) {
		return cloneWorkspaceSnapshot(EMPTY_WORKSPACE_SNAPSHOT);
	}

	return sessionWorkspace;
};

const setWorkspaceForSession = (
	state: WorkspaceBySessionState,
	sessionId: string,
	workspace: WorkspaceSnapshot,
): WorkspaceBySessionState => ({
	...state,
	[sessionId]: cloneWorkspaceSnapshot(workspace),
});

const updateActiveWorkspace = (
	get: Getter,
	set: Setter,
	updater: (current: WorkspaceSnapshot) => WorkspaceSnapshot,
) => {
	const sessionId = get(activeWorkspaceSessionIdAtom);
	const targetSessionId = sessionId || DEFAULT_WORKSPACE_SESSION_ID;

	const state = get(workspaceBySessionAtom);
	const current = getWorkspaceSnapshotForSession(state, targetSessionId);
	const updated = updater(current);
	set(
		workspaceBySessionAtom,
		setWorkspaceForSession(state, targetSessionId, updated),
	);
};

const currentWorkspaceSnapshotAtom = atom((get) => {
	const activeSessionId = get(activeWorkspaceSessionIdAtom);
	const workspaceBySession = get(workspaceBySessionAtom);
	return getWorkspaceSnapshotForSession(workspaceBySession, activeSessionId);
});

const workspaceHydratingAtom = atom((get) => {
	const activeSessionId = get(activeWorkspaceSessionIdAtom);
	if (!activeSessionId) {
		return false;
	}

	const hydratingState = get(workspaceHydratingBySessionAtom);
	return Boolean(hydratingState[activeSessionId]);
});

const setActiveWorkspaceSessionAtom = atom(
	null,
	(_get, set, sessionId: string) => {
		set(
			activeWorkspaceSessionIdAtom,
			sessionId || DEFAULT_WORKSPACE_SESSION_ID,
		);
	},
);

const setWorkspaceSnapshotForSessionAtom = atom(
	null,
	(get, set, payload: { sessionId: string; snapshot: WorkspaceSnapshot }) => {
		const { sessionId, snapshot } = payload;
		const state = get(workspaceBySessionAtom);
		set(
			workspaceBySessionAtom,
			setWorkspaceForSession(state, sessionId, snapshot),
		);
	},
);

const setWorkspaceHydratingAtom = atom(
	null,
	(
		get,
		set,
		payload: {
			sessionId: string;
			hydrating: boolean;
		},
	) => {
		const { sessionId, hydrating } = payload;
		const state = get(workspaceHydratingBySessionAtom);

		if (hydrating) {
			set(workspaceHydratingBySessionAtom, { ...state, [sessionId]: true });
			return;
		}

		const nextState = { ...state };
		delete nextState[sessionId];
		set(workspaceHydratingBySessionAtom, nextState);
	},
);

const createWorkspaceFieldAtom = <K extends keyof WorkspaceSnapshot>(key: K) =>
	atom(
		(get) => get(currentWorkspaceSnapshotAtom)[key],
		(get, set, value: WorkspaceSnapshot[K]) => {
			updateActiveWorkspace(get, set, (current) => ({
				...current,
				[key]: value,
			}));
		},
	);

const vncUrlAtom = createWorkspaceFieldAtom("vncUrl");
const workspaceViewAtom = createWorkspaceFieldAtom("view");
const workspaceChartAtom = createWorkspaceFieldAtom("chart");
const workspaceDatasetAtom = createWorkspaceFieldAtom("dataset");
const workspaceFileAtom = createWorkspaceFieldAtom("file");
const workspaceMarkdownContentAtom =
	createWorkspaceFieldAtom("markdownContent");

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

const showVncWorkspaceAtom = atom(null, (_get, set) => {
	set(workspaceViewAtom, "vnc");
});

const showChartWorkspaceAtom = atom(
	null,
	(_get, set, chart: WorkspaceChart) => {
		set(workspaceChartAtom, chart);
		set(workspaceViewAtom, "chart");
	},
);

const showDatasetWorkspaceAtom = atom(
	null,
	(_get, set, dataset: WorkspaceDataset) => {
		set(workspaceDatasetAtom, dataset);
		set(workspaceViewAtom, "dataset");
	},
);

const showFileWorkspaceAtom = atom(null, (_get, set, file: WorkspaceFile) => {
	set(workspaceFileAtom, file);
	set(workspaceViewAtom, "file");
});

const showMarkdownWorkspaceAtom = atom(null, (_get, set, content: string) => {
	set(workspaceMarkdownContentAtom, content);
	set(workspaceViewAtom, "markdown");
});

export {
	firstUserInputAtom,
	pendingHomePromptAtom,
	pendingHomeUploadsAtom,
	activeWorkspaceSessionIdAtom,
	workspaceBySessionAtom,
	workspaceHydratingBySessionAtom,
	workspaceHydratingAtom,
	setActiveWorkspaceSessionAtom,
	setWorkspaceSnapshotForSessionAtom,
	setWorkspaceHydratingAtom,
	vncUrlAtom,
	workspaceViewAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
	workspaceMarkdownContentAtom,
	agentStatusAtom,
	toolEventsAtom,
	dispatchToolEventAtom,
	clearToolEventsAtom,
	showVncWorkspaceAtom,
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	showFileWorkspaceAtom,
	showMarkdownWorkspaceAtom,
};

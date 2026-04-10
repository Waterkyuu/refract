import type {
	WorkspaceChart,
	WorkspaceDataset,
	WorkspaceFile,
	WorkspaceView,
} from "@/types";
import type { AgentStatus, ChatAttachment, ToolCallEvent } from "@/types/chat";
import { atom } from "jotai";

const firstUserInputAtom = atom<string>("");

const pendingHomeUploadsAtom = atom<ChatAttachment[]>([]);

const vncUrlAtom = atom<string>("");

const workspaceViewAtom = atom<WorkspaceView>("empty");

const workspaceChartAtom = atom<WorkspaceChart | null>(null);

const workspaceDatasetAtom = atom<WorkspaceDataset | null>(null);

const workspaceFileAtom = atom<WorkspaceFile | null>(null);

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

export {
	firstUserInputAtom,
	pendingHomeUploadsAtom,
	vncUrlAtom,
	workspaceViewAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
	agentStatusAtom,
	toolEventsAtom,
	dispatchToolEventAtom,
	clearToolEventsAtom,
	showVncWorkspaceAtom,
	showChartWorkspaceAtom,
	showDatasetWorkspaceAtom,
	showFileWorkspaceAtom,
};

import type {
	PipelineState,
	PipelineStep,
	StepStatus,
} from "@/lib/agent/agents/types";
import { atom } from "jotai";

const INITIAL_PIPELINE_STATE: PipelineState = {
	plan: null,
	currentStep: null,
	completedSteps: [],
	stepStatus: {
		data: "pending",
		chart: "pending",
		report: "pending",
	},
};

const pipelineAtom = atom<PipelineState>(INITIAL_PIPELINE_STATE);

const resetPipelineAtom = atom(null, (_get, set) => {
	set(pipelineAtom, INITIAL_PIPELINE_STATE);
});

const updatePipelineStepAtom = atom(
	null,
	(get, set, payload: { step: PipelineStep; status: StepStatus }) => {
		const prev = get(pipelineAtom);
		const { step, status } = payload;

		const completedSteps =
			status === "completed"
				? [...new Set([...prev.completedSteps, step])]
				: prev.completedSteps;

		set(pipelineAtom, {
			...prev,
			currentStep: status === "running" ? step : prev.currentStep,
			completedSteps,
			stepStatus: { ...prev.stepStatus, [step]: status },
		});
	},
);

const setPipelinePlanAtom = atom(
	null,
	(get, set, plan: PipelineState["plan"]) => {
		const prev = get(pipelineAtom);
		set(pipelineAtom, { ...prev, plan });
	},
);

export {
	pipelineAtom,
	resetPipelineAtom,
	updatePipelineStepAtom,
	setPipelinePlanAtom,
};

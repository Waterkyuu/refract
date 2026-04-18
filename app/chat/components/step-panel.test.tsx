import "@testing-library/jest-dom";
import type { PipelineState } from "@/types/agent";
import { fireEvent, render, screen } from "@testing-library/react";
import { useAtomValue } from "jotai";
import StepPanel from "./step-panel";

jest.mock("jotai", () => {
	const actual = jest.requireActual("jotai");
	return {
		...actual,
		useAtomValue: jest.fn(),
	};
});

const mockedUseAtomValue = jest.mocked(useAtomValue);

const buildPipelineState = (
	overrides: Partial<PipelineState> = {},
): PipelineState => ({
	plan: null,
	currentStep: null,
	completedSteps: [],
	stepStatus: {
		data: "pending",
		chart: "pending",
		report: "pending",
	},
	...overrides,
});

describe("StepPanel", () => {
	it("renders no steps while waiting for orchestrator plan", () => {
		mockedUseAtomValue.mockReturnValue(buildPipelineState());

		render(<StepPanel />);

		fireEvent.click(screen.getByRole("button", { name: /Pipeline Steps/i }));

		expect(screen.getByText("0/0 completed")).toBeInTheDocument();
		expect(screen.queryByText("Data")).not.toBeInTheDocument();
		expect(screen.queryByText("Chart")).not.toBeInTheDocument();
		expect(screen.queryByText("Report")).not.toBeInTheDocument();
	});

	it("renders only orchestrator planned steps", () => {
		mockedUseAtomValue.mockReturnValue(
			buildPipelineState({
				plan: {
					steps: ["data"],
					reasoning: "Need data cleaning only",
				},
			}),
		);

		render(<StepPanel />);

		fireEvent.click(screen.getByRole("button", { name: /Pipeline Steps/i }));

		expect(screen.getByText("0/1 completed")).toBeInTheDocument();
		expect(screen.getByText("Data")).toBeInTheDocument();
		expect(screen.queryByText("Chart")).not.toBeInTheDocument();
		expect(screen.queryByText("Report")).not.toBeInTheDocument();
	});
});

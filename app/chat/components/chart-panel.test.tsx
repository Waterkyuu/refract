import jotaiStore from "@/atoms";
import { workspaceChartAtom } from "@/atoms/chat";
import { fireEvent, render, screen } from "@testing-library/react";
import ChartPanel from "./chart-panel";

describe("ChartPanel", () => {
	beforeEach(() => {
		jotaiStore.set(workspaceChartAtom, null);
	});

	it("renders chart image from downloadUrl when single image in images array", () => {
		jotaiStore.set(workspaceChartAtom, {
			generatedAt: Date.now(),
			title: "Revenue trend",
			toolCallId: "tool-1",
			images: [
				{
					downloadUrl: "https://public.example/revenue.png",
					fileId: "chart-1",
					filename: "revenue.png",
				},
			],
		});

		render(<ChartPanel />);

		const image = screen.getByRole("img", { name: "Revenue trend" });
		expect(image).toHaveAttribute("src", "https://public.example/revenue.png");
	});

	it("shows navigation controls when multiple images exist", () => {
		jotaiStore.set(workspaceChartAtom, {
			generatedAt: Date.now(),
			title: "Charts",
			toolCallId: "tool-1",
			images: [
				{
					downloadUrl: "https://public.example/chart1.png",
					fileId: "chart-1",
					filename: "chart_1.png",
				},
				{
					downloadUrl: "https://public.example/chart2.png",
					fileId: "chart-2",
					filename: "chart_2.png",
				},
			],
		});

		render(<ChartPanel />);

		expect(screen.getByText("1 / 2")).toBeInTheDocument();
		expect(screen.getByLabelText("Previous chart")).toBeInTheDocument();
		expect(screen.getByLabelText("Next chart")).toBeInTheDocument();
	});

	it("navigates between images with next/previous buttons", () => {
		jotaiStore.set(workspaceChartAtom, {
			generatedAt: Date.now(),
			title: "Charts",
			toolCallId: "tool-1",
			images: [
				{
					downloadUrl: "https://public.example/chart1.png",
					fileId: "chart-1",
					filename: "chart_1.png",
				},
				{
					downloadUrl: "https://public.example/chart2.png",
					fileId: "chart-2",
					filename: "chart_2.png",
				},
			],
		});

		render(<ChartPanel />);

		const image = screen.getByRole("img", { name: "Charts" });
		expect(image).toHaveAttribute("src", "https://public.example/chart1.png");

		fireEvent.click(screen.getByLabelText("Next chart"));
		expect(image).toHaveAttribute("src", "https://public.example/chart2.png");
		expect(screen.getByText("2 / 2")).toBeInTheDocument();

		fireEvent.click(screen.getByLabelText("Previous chart"));
		expect(image).toHaveAttribute("src", "https://public.example/chart1.png");
		expect(screen.getByText("1 / 2")).toBeInTheDocument();
	});

	it("hides navigation controls when only one image", () => {
		jotaiStore.set(workspaceChartAtom, {
			generatedAt: Date.now(),
			title: "Single",
			toolCallId: "tool-1",
			images: [
				{
					downloadUrl: "https://public.example/chart.png",
					fileId: "chart-1",
					filename: "chart.png",
				},
			],
		});

		render(<ChartPanel />);

		expect(screen.queryByLabelText("Previous chart")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Next chart")).not.toBeInTheDocument();
	});

	it("shows waiting state when no chart data", () => {
		render(<ChartPanel />);
		expect(screen.getByText("Waiting for chart output...")).toBeInTheDocument();
	});
});

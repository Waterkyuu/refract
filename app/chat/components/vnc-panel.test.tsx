import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VncViewer } from "./vnc-panel";

describe("VncViewer", () => {
	it("renders waiting state when no url", () => {
		render(<VncViewer url="" />);
		expect(
			screen.getByText("Waiting for Agent Sandbox..."),
		).toBeInTheDocument();
	});

	it("renders iframe markup when url is provided", () => {
		const { container } = render(
			<VncViewer url="https://8080-sb-old.e2b.dev" />,
		);

		expect(container.innerHTML).toContain("iframe");
		expect(container.innerHTML).toContain("https://8080-sb-old.e2b.dev");
		expect(container.innerHTML).not.toContain("Waiting for Agent Sandbox...");
	});

	it("switches back to waiting state when url cleared", () => {
		const { rerender } = render(
			<VncViewer url="https://8080-sb-old.e2b.dev" />,
		);

		rerender(<VncViewer url="" />);
		expect(
			screen.getByText("Waiting for Agent Sandbox..."),
		).toBeInTheDocument();
	});
});

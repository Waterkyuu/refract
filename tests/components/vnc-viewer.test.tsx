import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { VncViewer } from "@/components/agent/vnc-viewer";

const ViewerHarness = ({
	onRender,
	url = "https://8080-demo-agent.e2b.dev",
}: {
	onRender: () => void;
	url?: string;
}) => {
	const [value, setValue] = useState("");
	const [viewerUrl, setViewerUrl] = useState(url);

	return (
		<div>
			<input
				aria-label="prompt"
				onChange={(event) => setValue(event.target.value)}
				value={value}
			/>
			<button
				onClick={() => setViewerUrl(`${viewerUrl}?refresh=1`)}
				type="button"
			>
				change-url
			</button>
			<VncViewer onRender={onRender} url={viewerUrl} />
		</div>
	);
};

describe("VncViewer memoization", () => {
	it("does not rerender when only the parent typing state changes", () => {
		const onRender = jest.fn();

		render(<ViewerHarness onRender={onRender} />);

		expect(onRender).toHaveBeenCalledTimes(1);

		fireEvent.change(screen.getByLabelText("prompt"), {
			target: { value: "search chatgpt.com" },
		});

		expect(onRender).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: "change-url" }));

		expect(onRender).toHaveBeenCalledTimes(2);
	});
});

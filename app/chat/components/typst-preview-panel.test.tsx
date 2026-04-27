import { workspaceTypstContentAtom } from "@/atoms";
import jotaiStore from "@/atoms";
import { act, render, waitFor } from "@testing-library/react";
import TypstPreview from "./typst-preview-panel";

class MockWorker {
	static instances: MockWorker[] = [];
	onmessage: ((event: MessageEvent) => void) | null = null;
	postMessage = jest.fn();
	terminate = jest.fn();

	constructor() {
		MockWorker.instances.push(this);
	}
}

describe("TypstPreview", () => {
	const originalWorker = global.Worker;

	beforeEach(() => {
		MockWorker.instances = [];
		global.Worker = MockWorker as unknown as typeof Worker;
		jotaiStore.set(workspaceTypstContentAtom, "= 中文报告");
	});

	afterEach(() => {
		global.Worker = originalWorker;
	});

	it("sends Typst content to the worker using the compile content field", async () => {
		render(<TypstPreview />);

		const worker = MockWorker.instances[0];
		expect(worker).toBeDefined();
		act(() => {
			worker?.onmessage?.({
				data: { type: "init-complete" },
			} as MessageEvent);
		});

		await waitFor(() => {
			expect(worker?.postMessage).toHaveBeenCalledWith({
				type: "compile",
				content: "= 中文报告",
			});
		});

		act(() => {
			jotaiStore.set(workspaceTypstContentAtom, "= 更新后的中文报告");
		});

		await waitFor(() => {
			expect(worker?.postMessage).toHaveBeenCalledWith({
				type: "compile",
				content: "= 更新后的中文报告",
			});
		});
		expect(worker?.postMessage).not.toHaveBeenCalledWith({
			type: "compile",
			typstContent: "= 更新后的中文报告",
		});
	});
});

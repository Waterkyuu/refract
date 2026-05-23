import jotaiStore, { workspaceMarkdownContentAtom } from "@/atoms";
import { exportMarkdownFile, exportMarkdownPdf } from "@/lib/markdown-export";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import MarkdownPreview from "./markdown-preview-panel";

jest.mock("@/lib/markdown-export", () => ({
	exportMarkdownFile: jest.fn(),
	exportMarkdownPdf: jest.fn(async () => "refract-markdown.pdf"),
}));

jest.mock("react-markdown", () => ({
	__esModule: true,
	default: ({ children }: { children: string }) => <div>{children}</div>,
}));

jest.mock("./mermaid-chart", () => ({
	__esModule: true,
	default: ({ chart }: { chart: string }) => <div>{chart}</div>,
}));

const exportMarkdownFileMock = exportMarkdownFile as jest.MockedFunction<
	typeof exportMarkdownFile
>;
const exportMarkdownPdfMock = exportMarkdownPdf as jest.MockedFunction<
	typeof exportMarkdownPdf
>;

describe("MarkdownPreview", () => {
	beforeEach(() => {
		act(() => {
			jotaiStore.set(workspaceMarkdownContentAtom, "# Report\n\nHello export");
		});
	});

	afterEach(() => {
		act(() => {
			jotaiStore.set(workspaceMarkdownContentAtom, "");
		});
		jest.clearAllMocks();
	});

	it("exports the raw markdown content from the export menu", async () => {
		render(<MarkdownPreview />);

		fireEvent.keyDown(screen.getByRole("button", { name: /export/i }), {
			key: "ArrowDown",
		});
		fireEvent.click(await screen.findByRole("menuitem", { name: /markdown/i }));

		expect(exportMarkdownFileMock).toHaveBeenCalledWith(
			"# Report\n\nHello export",
		);
	});

	it("downloads the rendered markdown preview as a pdf", async () => {
		render(<MarkdownPreview />);

		fireEvent.keyDown(screen.getByRole("button", { name: /export/i }), {
			key: "ArrowDown",
		});
		fireEvent.click(await screen.findByRole("menuitem", { name: /pdf/i }));

		await waitFor(() =>
			expect(exportMarkdownPdfMock).toHaveBeenCalledWith({
				sourceElement: expect.any(HTMLElement),
			}),
		);
	});
});

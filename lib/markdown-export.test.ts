import {
	createMarkdownBlob,
	exportMarkdownFile,
	exportMarkdownPdf,
	withFileExtension,
} from "./markdown-export";

const readBlobText = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.addEventListener("load", () => {
			resolve(String(reader.result));
		});
		reader.addEventListener("error", () => {
			reject(reader.error);
		});
		reader.readAsText(blob);
	});

describe("markdown export helpers", () => {
	it("adds the requested extension when filename has no extension", () => {
		expect(withFileExtension("analysis-report", "md")).toBe(
			"analysis-report.md",
		);
	});

	it("replaces a different extension with the requested extension", () => {
		expect(withFileExtension("analysis-report.pdf", "md")).toBe(
			"analysis-report.md",
		);
	});

	it("creates a markdown blob with utf-8 content type", async () => {
		const blob = createMarkdownBlob("# Report\n\nHello");

		expect(blob.type).toBe("text/markdown;charset=utf-8");
		await expect(readBlobText(blob)).resolves.toBe("# Report\n\nHello");
	});

	it("downloads the raw markdown file", () => {
		const createObjectURL = jest.fn(() => "blob:markdown");
		const revokeObjectURL = jest.fn();
		const originalCreateElement = document.createElement.bind(document);
		const anchor = document.createElement("a");
		const clickSpy = jest.spyOn(anchor, "click").mockImplementation(() => {});
		const createElementSpy = jest
			.spyOn(document, "createElement")
			.mockImplementation(((tagName: string) =>
				tagName === "a"
					? anchor
					: originalCreateElement(tagName)) as typeof document.createElement);

		const filename = exportMarkdownFile("# Report", {
			document,
			filename: "analysis-report",
			url: {
				createObjectURL,
				revokeObjectURL,
			},
		});

		expect(filename).toBe("analysis-report.md");
		expect(createObjectURL).toHaveBeenCalled();
		expect(anchor.download).toBe("analysis-report.md");
		expect(clickSpy).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:markdown");

		createElementSpy.mockRestore();
		clickSpy.mockRestore();
	});

	it("captures the preview with snapdom and downloads a pdf", async () => {
		const createObjectURL = jest.fn(() => "blob:pdf");
		const revokeObjectURL = jest.fn();
		const originalCreateElement = document.createElement.bind(document);
		const anchor = document.createElement("a");
		const drawImage = jest.fn();
		const sourceElement = document.createElement("article");
		const canvas = document.createElement("canvas");
		const clickSpy = jest.spyOn(anchor, "click").mockImplementation(() => {});
		const createElementSpy = jest
			.spyOn(document, "createElement")
			.mockImplementation(((tagName: string) =>
				tagName === "a"
					? anchor
					: originalCreateElement(tagName)) as typeof document.createElement);
		const getContextSpy = jest
			.spyOn(HTMLCanvasElement.prototype, "getContext")
			.mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
		const toBlobSpy = jest
			.spyOn(HTMLCanvasElement.prototype, "toBlob")
			.mockImplementation((callback) => {
				callback?.(new Blob(["png"], { type: "image/png" }));
			});
		const captureElement = jest.fn(async () => ({
			toCanvas: async () => canvas,
		}));
		const addPage = jest.fn(() => ({
			drawImage: jest.fn(),
		}));
		const embedPng = jest.fn(async () => ({}));
		const save = jest.fn(async () => new Uint8Array([4, 5, 6]));
		const createPdfDocument = jest.fn(async () => ({
			addPage,
			embedPng,
			save,
		}));

		sourceElement.innerHTML = "<h1>Report</h1>";
		canvas.width = 200;
		canvas.height = 400;

		const filename = await exportMarkdownPdf({
			captureElement,
			createPdfDocument,
			document,
			filename: "analysis-report",
			sourceElement,
			url: {
				createObjectURL,
				revokeObjectURL,
			},
		});

		expect(captureElement).toHaveBeenCalledWith(
			sourceElement,
			expect.objectContaining({
				backgroundColor: "#ffffff",
				embedFonts: true,
				scale: 2,
			}),
		);
		expect(createPdfDocument).toHaveBeenCalled();
		expect(embedPng).toHaveBeenCalled();
		expect(save).toHaveBeenCalled();
		expect(filename).toBe("analysis-report.pdf");
		expect(anchor.download).toBe("analysis-report.pdf");
		expect(clickSpy).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:pdf");

		createElementSpy.mockRestore();
		getContextSpy.mockRestore();
		toBlobSpy.mockRestore();
		clickSpy.mockRestore();
	});

	it("returns false when the snapdom source element is empty", async () => {
		const sourceElement = document.createElement("article");

		await expect(
			exportMarkdownPdf({
				filename: "analysis-report",
				sourceElement,
			}),
		).resolves.toBe(false);
	});

	it("throws when snapdom export cannot create a png blob", async () => {
		const captureElement = jest.fn(async () => ({
			toCanvas: async () => document.createElement("canvas"),
		}));
		const sourceElement = document.createElement("article");
		const getContextSpy = jest
			.spyOn(HTMLCanvasElement.prototype, "getContext")
			.mockReturnValue({
				drawImage: jest.fn(),
			} as unknown as CanvasRenderingContext2D);
		const toBlobSpy = jest
			.spyOn(HTMLCanvasElement.prototype, "toBlob")
			.mockImplementation((callback) => {
				callback?.(null);
			});

		sourceElement.innerHTML = "<h1>Report</h1>";

		await expect(
			exportMarkdownPdf({
				captureElement,
				filename: "analysis-report",
				sourceElement,
			}),
		).rejects.toThrow("Failed to convert SnapDOM canvas to PNG.");

		getContextSpy.mockRestore();
		toBlobSpy.mockRestore();
	});
});

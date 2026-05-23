const MARKDOWN_EXPORT_BASENAME = "refract-markdown";
const MARKDOWN_MIME_TYPE = "text/markdown;charset=utf-8";
const PDF_PAGE_HEIGHT = 841.89;
const PDF_PAGE_MARGIN = 36;
const PDF_PAGE_WIDTH = 595.28;
const SNAPDOM_PDF_SCALE = 2;

type FileExtension = "md" | "pdf";

type DownloadBlobOptions = {
	document?: Document;
	url?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
};

type MarkdownFileExportOptions = DownloadBlobOptions & {
	filename?: string;
};

type SnapdomCanvasCapture = {
	toCanvas: () => Promise<HTMLCanvasElement>;
};

type SnapdomCaptureElement = (
	element: HTMLElement,
	options: Record<string, unknown>,
) => Promise<SnapdomCanvasCapture>;

type SnapdomPdfDocumentPage = {
	drawImage: (
		image: unknown,
		options: {
			height: number;
			width: number;
			x: number;
			y: number;
		},
	) => void;
};

type SnapdomPdfDocument = {
	addPage: (size: [number, number]) => SnapdomPdfDocumentPage;
	embedPng: (bytes: Uint8Array) => Promise<unknown>;
	save: () => Promise<Uint8Array>;
};

type MarkdownPdfExportOptions = DownloadBlobOptions & {
	captureElement?: SnapdomCaptureElement;
	createPdfDocument?: () => Promise<SnapdomPdfDocument>;
	filename?: string;
	sourceElement: HTMLElement;
};

const withFileExtension = (filename: string, extension: FileExtension) => {
	const cleanFilename = filename.trim() || MARKDOWN_EXPORT_BASENAME;
	const normalizedExtension = extension.replace(/^\./, "");
	const filenameWithoutExtension = cleanFilename.replace(/\.[^/.]+$/, "");

	return `${filenameWithoutExtension}.${normalizedExtension}`;
};

const createMarkdownBlob = (content: string) =>
	new Blob([content], { type: MARKDOWN_MIME_TYPE });

const downloadBlob = (
	blob: Blob,
	filename: string,
	options: DownloadBlobOptions = {},
) => {
	const targetDocument = options.document ?? document;
	const urlApi = options.url ?? URL;
	const objectUrl = urlApi.createObjectURL(blob);
	const link = targetDocument.createElement("a");

	link.href = objectUrl;
	link.download = filename;
	link.rel = "noopener";

	targetDocument.body.append(link);
	link.click();
	link.remove();
	urlApi.revokeObjectURL(objectUrl);
};

const exportMarkdownFile = (
	content: string,
	options: MarkdownFileExportOptions = {},
) => {
	const filename = withFileExtension(
		options.filename ?? MARKDOWN_EXPORT_BASENAME,
		"md",
	);
	const blob = createMarkdownBlob(content);

	downloadBlob(blob, filename, options);

	return filename;
};

const hasExportableElementContent = (sourceElement: HTMLElement) => {
	const visibleText =
		"innerText" in sourceElement && typeof sourceElement.innerText === "string"
			? sourceElement.innerText
			: (sourceElement.textContent ?? "");

	return Boolean(visibleText.trim() || sourceElement.innerHTML.trim());
};

const createCanvasSlice = (
	sourceCanvas: HTMLCanvasElement,
	offsetY: number,
	sliceHeight: number,
) => {
	const ownerDocument = sourceCanvas.ownerDocument ?? document;
	const sliceCanvas = ownerDocument.createElement("canvas");
	const context = sliceCanvas.getContext("2d");

	sliceCanvas.width = sourceCanvas.width;
	sliceCanvas.height = sliceHeight;

	if (!context) {
		throw new Error("Unable to create SnapDOM PDF canvas context.");
	}

	context.drawImage(
		sourceCanvas,
		0,
		offsetY,
		sourceCanvas.width,
		sliceHeight,
		0,
		0,
		sourceCanvas.width,
		sliceHeight,
	);

	return sliceCanvas;
};

const createCanvasBlob = (canvas: HTMLCanvasElement) =>
	new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error("Failed to convert SnapDOM canvas to PNG."));
				return;
			}

			resolve(blob);
		}, "image/png");
	});

const readBlobBytes = async (blob: Blob) => {
	if (typeof blob.arrayBuffer === "function") {
		return new Uint8Array(await blob.arrayBuffer());
	}

	return new Promise<Uint8Array>((resolve, reject) => {
		const reader = new FileReader();

		reader.addEventListener("load", () => {
			resolve(new Uint8Array(reader.result as ArrayBuffer));
		});
		reader.addEventListener("error", () => {
			reject(reader.error);
		});
		reader.readAsArrayBuffer(blob);
	});
};

const createCanvasBytes = async (canvas: HTMLCanvasElement) =>
	readBlobBytes(await createCanvasBlob(canvas));

const addCanvasPagesToPdf = async (
	canvas: HTMLCanvasElement,
	pdfDocument: SnapdomPdfDocument,
) => {
	const printableHeight = PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN * 2;
	const printableWidth = PDF_PAGE_WIDTH - PDF_PAGE_MARGIN * 2;
	const pageCanvasHeight = Math.floor(
		(printableHeight * canvas.width) / printableWidth,
	);

	for (let offsetY = 0; offsetY < canvas.height; offsetY += pageCanvasHeight) {
		const sliceHeight = Math.min(pageCanvasHeight, canvas.height - offsetY);
		const pageCanvas = createCanvasSlice(canvas, offsetY, sliceHeight);
		const pageBytes = await createCanvasBytes(pageCanvas);
		const pageImage = await pdfDocument.embedPng(pageBytes);
		const page = pdfDocument.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
		const pageImageHeight = (sliceHeight * printableWidth) / canvas.width;

		page.drawImage(pageImage, {
			height: pageImageHeight,
			width: printableWidth,
			x: PDF_PAGE_MARGIN,
			y: PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN - pageImageHeight,
		});
	}
};

const createSnapdomCaptureElement: SnapdomCaptureElement = async (
	element,
	options,
) => {
	const { snapdom } = await import("@zumer/snapdom");
	return snapdom(element, options) as Promise<SnapdomCanvasCapture>;
};

const createSnapdomPdfDocument = async (): Promise<SnapdomPdfDocument> => {
	const { PDFDocument } = await import("pdf-lib");
	return (await PDFDocument.create()) as unknown as SnapdomPdfDocument;
};

const exportMarkdownPdf = async ({
	captureElement = createSnapdomCaptureElement,
	createPdfDocument = createSnapdomPdfDocument,
	document: targetDocument,
	filename,
	sourceElement,
	url,
}: MarkdownPdfExportOptions) => {
	if (!hasExportableElementContent(sourceElement)) {
		return false;
	}

	const capture = await captureElement(sourceElement, {
		backgroundColor: "#ffffff",
		embedFonts: true,
		fast: false,
		scale: SNAPDOM_PDF_SCALE,
	});
	const canvas = await capture.toCanvas();
	const pdfDocument = await createPdfDocument();

	await addCanvasPagesToPdf(canvas, pdfDocument);

	const pdfBytes = await pdfDocument.save();
	const normalizedPdfBytes = new Uint8Array(pdfBytes);
	const resolvedFilename = withFileExtension(
		filename ?? MARKDOWN_EXPORT_BASENAME,
		"pdf",
	);

	downloadBlob(
		new Blob([normalizedPdfBytes], { type: "application/pdf" }),
		resolvedFilename,
		{
			document: targetDocument,
			url,
		},
	);

	return resolvedFilename;
};

export {
	createMarkdownBlob,
	exportMarkdownFile,
	exportMarkdownPdf,
	withFileExtension,
};
export type {
	MarkdownFileExportOptions,
	MarkdownPdfExportOptions,
	SnapdomCaptureElement,
	SnapdomPdfDocument,
};

import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { S3 } from "@/infra/r2";
import { getLowercaseExtension, isDatasetFilename } from "@/lib/file";
import {
	type DatasetPreview,
	type FileRecord,
	FileRecordSchema,
} from "@/types";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import iconv from "iconv-lite";
import { read, utils } from "xlsx";

const BUCKET_NAME = process.env.BUCKET_NAME ?? "";
const FILE_STORE_ROOT = join(tmpdir(), "refract-files");
const CHUNKS_ROOT = join(FILE_STORE_ROOT, "chunks");
const RECORDS_ROOT = join(FILE_STORE_ROOT, "records");
const DATASET_PREVIEW_ROW_LIMIT = 50;
const DATASET_PREVIEW_ROW_LIMIT_MAX = 5000;
const DATASET_PREVIEW_ROW_LIMIT_MIN = 1;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL?.trim();

const ensureStorageDirs = async () => {
	await mkdir(CHUNKS_ROOT, { recursive: true });
	await mkdir(RECORDS_ROOT, { recursive: true });
};

// Heuristic: try UTF-8 first; if invalid sequences are found, fall back to GB18030.
const decodeBufferToUtf8 = (buffer: Buffer): string => {
	const BOM = 0xef_bb_bf;
	if (
		buffer.length >= 3 &&
		buffer[0] === BOM >> 16 &&
		buffer[1] === ((BOM >> 8) & 0xff) &&
		buffer[2] === (BOM & 0xff)
	) {
		return buffer.toString("utf-8");
	}

	const asUtf8 = buffer.toString("utf-8");
	if (!isUtf8(buffer)) {
		return iconv.decode(buffer, "gb18030");
	}
	return asUtf8;
};

const isUtf8 = (buf: Buffer): boolean => {
	let i = 0;
	while (i < buf.length) {
		const byte = buf[i];
		if (byte <= 0x7f) {
			i += 1;
		} else if (byte >= 0xc2 && byte <= 0xdf) {
			if (i + 1 >= buf.length || (buf[i + 1] & 0xc0) !== 0x80) return false;
			i += 2;
		} else if (byte >= 0xe0 && byte <= 0xef) {
			if (i + 2 >= buf.length) return false;
			if (byte === 0xe0 && buf[i + 1] < 0xa0) return false;
			if ((buf[i + 1] & 0xc0) !== 0x80) return false;
			if ((buf[i + 2] & 0xc0) !== 0x80) return false;
			i += 3;
		} else if (byte >= 0xf0 && byte <= 0xf4) {
			if (i + 3 >= buf.length) return false;
			if (byte === 0xf0 && buf[i + 1] < 0x90) return false;
			if (byte === 0xf4 && buf[i + 1] > 0x8f) return false;
			if ((buf[i + 1] & 0xc0) !== 0x80) return false;
			if ((buf[i + 2] & 0xc0) !== 0x80) return false;
			if ((buf[i + 3] & 0xc0) !== 0x80) return false;
			i += 4;
		} else {
			return false;
		}
	}
	return true;
};

const sanitizeFilename = (filename: string) => basename(filename);

const getFilenameToken = (filename: string) =>
	Buffer.from(sanitizeFilename(filename)).toString("base64url");

const getChunkDir = (filename: string) =>
	join(CHUNKS_ROOT, getFilenameToken(filename));

const getChunkPath = (filename: string, index: number) =>
	join(getChunkDir(filename), `${index}.part`);

const getRecordPath = (fileId: string) => join(RECORDS_ROOT, `${fileId}.json`);

const normalizePreviewRows = (rows: unknown[][], totalColumns: number) =>
	rows.map((row) =>
		Array.from({ length: totalColumns }, (_, index) =>
			String(row[index] ?? ""),
		),
	);

const normalizePreviewLimit = (rowLimit: number) => {
	const normalized = Math.floor(rowLimit);
	if (!Number.isFinite(normalized)) {
		return DATASET_PREVIEW_ROW_LIMIT;
	}

	return Math.min(
		Math.max(normalized, DATASET_PREVIEW_ROW_LIMIT_MIN),
		DATASET_PREVIEW_ROW_LIMIT_MAX,
	);
};

const buildDatasetPreview = (
	buffer: Buffer,
	filename: string,
	rowLimit = DATASET_PREVIEW_ROW_LIMIT,
): DatasetPreview | undefined => {
	if (!isDatasetFilename(filename)) {
		return undefined;
	}

	const limit = normalizePreviewLimit(rowLimit);
	const ext = getLowercaseExtension(filename);
	const isCsv = ext === "csv" || ext === "tsv";

	const workbook = isCsv
		? read(decodeBufferToUtf8(buffer), {
				type: "string",
				cellDates: true,
				cellText: true,
				dense: true,
			})
		: read(buffer, {
				type: "buffer",
				cellDates: true,
				cellText: true,
				dense: true,
			});
	const activeSheet = workbook.SheetNames[0];
	if (!activeSheet) {
		return {
			sheetNames: [],
			activeSheet: "",
			columns: [],
			rows: [],
			totalRows: 0,
			totalColumns: 0,
		};
	}

	const worksheet = workbook.Sheets[activeSheet];
	const rawRows = (
		utils.sheet_to_json(worksheet, {
			header: 1,
			raw: false,
			defval: "",
			blankrows: false,
		}) as unknown[][]
	).map((row) => (Array.isArray(row) ? row : []));

	const headerRow = rawRows[0] ?? [];
	const bodyRows = rawRows.slice(1);
	const totalColumns = Math.max(
		headerRow.length,
		...bodyRows.map((row) => row.length),
		0,
	);
	const columns = Array.from({ length: totalColumns }, (_, index) => {
		const headerValue = headerRow[index];
		const normalized = String(headerValue ?? "").trim();
		return normalized || `Column ${index + 1}`;
	});

	return {
		sheetNames: workbook.SheetNames,
		activeSheet,
		columns,
		rows: normalizePreviewRows(bodyRows.slice(0, limit), totalColumns),
		totalRows: bodyRows.length,
		totalColumns,
	};
};

// Build a direct public URL when R2 is publicly exposed; fallback to API proxy.
const getFileDownloadUrl = (record: Pick<FileRecord, "id" | "objectKey">) => {
	if (R2_PUBLIC_BASE_URL && record.objectKey) {
		const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
		const key = record.objectKey.replace(/^\/+/, "");
		return `${base}/${key}`;
	}

	return `/api/file/${record.id}/download`;
};

const saveFileRecord = async (record: FileRecord) => {
	await ensureStorageDirs();
	await writeFile(
		getRecordPath(record.id),
		JSON.stringify(record, null, 2),
		"utf8",
	);
};

const writeChunkFile = async ({
	chunk,
	filename,
	index,
}: {
	chunk: Uint8Array;
	filename: string;
	index: number;
}) => {
	const safeFilename = sanitizeFilename(filename);
	const chunkDir = getChunkDir(safeFilename);

	await ensureStorageDirs();
	await mkdir(chunkDir, { recursive: true });
	await writeFile(getChunkPath(safeFilename, index), Buffer.from(chunk));
};

const storeFileRecordFromBytes = async ({
	bytes,
	contentType,
	filename,
	kind,
}: {
	bytes: Uint8Array;
	contentType?: string | null;
	filename: string;
	kind?: "dataset" | "document";
}) => {
	if (!BUCKET_NAME) {
		throw new Error("BUCKET_NAME is not configured.");
	}

	const safeFilename = sanitizeFilename(filename);
	const mergedBuffer = Buffer.from(bytes);
	const fileId = crypto.randomUUID();
	const objectKey = `${fileId}/${safeFilename}`;
	const preview = buildDatasetPreview(mergedBuffer, safeFilename);
	const now = new Date().toISOString();
	const record: FileRecord = {
		id: fileId,
		filename: safeFilename,
		contentType: contentType ?? null,
		fileSize: mergedBuffer.byteLength,
		status: "ready",
		kind: kind ?? (preview ? "dataset" : "document"),
		objectKey,
		preview,
		errorMessage: null,
		createdAt: now,
		updatedAt: now,
	};

	await S3.send(
		new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: objectKey,
			Body: mergedBuffer,
			ContentType: contentType ?? "application/octet-stream",
		}),
	);
	await saveFileRecord(record);

	return record;
};

const mergeUploadedFile = async ({
	contentType,
	filename,
	totalChunks,
}: {
	contentType?: string | null;
	filename: string;
	totalChunks: number;
}) => {
	const safeFilename = sanitizeFilename(filename);
	const chunkBuffers = await Promise.all(
		Array.from({ length: totalChunks }, async (_, index) =>
			readFile(getChunkPath(safeFilename, index)),
		),
	);
	const record = await storeFileRecordFromBytes({
		bytes: Buffer.concat(chunkBuffers),
		contentType,
		filename: safeFilename,
	});
	await rm(getChunkDir(safeFilename), { recursive: true, force: true });

	return record;
};

const cancelUploadByFilename = async (filename: string) => {
	await rm(getChunkDir(filename), { recursive: true, force: true });
};

const readFileRecord = async (fileId: string) => {
	await ensureStorageDirs();

	try {
		const raw = await readFile(getRecordPath(fileId), "utf8");
		const parsed = JSON.parse(raw);
		return FileRecordSchema.parse(parsed);
	} catch (error) {
		throw new Error(
			error instanceof Error
				? error.message
				: `Unable to find file record ${fileId}.`,
		);
	}
};

const getFileRecordStatus = async (fileId: string) => {
	const record = await readFileRecord(fileId);
	return record;
};

const getUploadedFileBytes = async (fileId: string) => {
	if (!BUCKET_NAME) {
		throw new Error("BUCKET_NAME is not configured.");
	}

	const record = await readFileRecord(fileId);
	if (!record.objectKey) {
		throw new Error(
			`Uploaded file ${fileId} does not have a storage object key.`,
		);
	}

	const response = await S3.send(
		new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: record.objectKey,
		}),
	);
	const body = response.Body;
	if (!body) {
		throw new Error(`Uploaded file ${fileId} is empty.`);
	}

	if (!("transformToByteArray" in body)) {
		throw new Error(`Uploaded file ${fileId} cannot be converted to bytes.`);
	}

	const bytes = await body.transformToByteArray();

	return {
		bytes,
		record,
	};
};

const getDatasetPreviewByFileId = async (fileId: string, rowLimit = 200) => {
	const { bytes, record } = await getUploadedFileBytes(fileId);
	const preview = buildDatasetPreview(
		Buffer.from(bytes),
		record.filename,
		rowLimit,
	);

	if (!preview) {
		throw new Error(`File ${record.filename} is not a supported dataset.`);
	}

	return {
		downloadUrl: getFileDownloadUrl(record),
		fileId: record.id,
		filename: record.filename,
		preview,
	};
};

const hasChunkFile = async (filename: string, index: number) => {
	try {
		await stat(getChunkPath(filename, index));
		return true;
	} catch {
		return false;
	}
};

const listUploadedChunks = async (filename: string, totalChunks: number) => {
	const uploadedChunks: number[] = [];
	for (let index = 0; index < totalChunks; index += 1) {
		if (await hasChunkFile(filename, index)) {
			uploadedChunks.push(index);
		}
	}
	return uploadedChunks;
};

export {
	cancelUploadByFilename,
	getDatasetPreviewByFileId,
	getFileDownloadUrl,
	getFileRecordStatus,
	getUploadedFileBytes,
	listUploadedChunks,
	mergeUploadedFile,
	readFileRecord,
	saveFileRecord,
	sanitizeFilename,
	storeFileRecordFromBytes,
	writeChunkFile,
};

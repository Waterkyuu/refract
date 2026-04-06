import apiClient from "@/services/api-client";
import { voidPost, zodGet, zodPost } from "@/services/request";
import { FileRecordSchema, MergeFileResponseSchema } from "@/types";
import { handleError } from "./error-handler";

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024;
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_CHUNK_CONCURRENCY = 4;
const DEFAULT_FILE_CONCURRENCY = 2;
const DEFAULT_STATUS_POLL_INTERVAL = 1000;
const DEFAULT_STATUS_TIMEOUT = 60_000;

type UploadProgressHandler = (progress: number) => void;

type UploadResult = {
	fileId: string;
	filename: string;
};

type CreateChunksOptions = {
	file: File;
	chunkSize?: number;
};

type UploadChunkOptions = {
	chunk: Blob;
	chunkIndex: number;
	filename: string;
	retryCount?: number;
	signal?: AbortSignal;
};

type UploadChunksOptions = {
	chunks: Blob[];
	filename: string;
	concurrency?: number;
	onProgress?: UploadProgressHandler;
	signal?: AbortSignal;
};

type UploadFileOptions = {
	file: File;
	chunkSize?: number;
	chunkConcurrency?: number;
	statusPollInterval?: number;
	statusTimeout?: number;
	onProgress?: UploadProgressHandler;
	signal?: AbortSignal;
};

type UploadFilesOptions = {
	files: File[];
	fileConcurrency?: number;
	chunkConcurrency?: number;
	onProgress?: (file: File, progress: number) => void;
	signal?: AbortSignal;
};

type MergeFileOptions = {
	filename: string;
	totalChunks: number;
};

const sleep = async (duration: number): Promise<void> =>
	new Promise((resolve) => {
		globalThis.setTimeout(resolve, duration);
	});

const createChunks = ({
	file,
	chunkSize = DEFAULT_CHUNK_SIZE,
}: CreateChunksOptions): Blob[] => {
	if (file.size === 0) {
		return [file];
	}

	const chunks: Blob[] = [];
	let cur = 0;

	while (cur < file.size) {
		chunks.push(file.slice(cur, cur + chunkSize));
		cur += chunkSize;
	}

	return chunks;
};

// Upload a single chunk
const uploadChunk = async ({
	chunk,
	chunkIndex,
	filename,
	retryCount = DEFAULT_RETRY_COUNT,
	signal,
}: UploadChunkOptions): Promise<void> => {
	const formData = new FormData();

	formData.append("chunk", chunk, filename);
	formData.append("index", String(chunkIndex));
	formData.append("filename", filename);

	try {
		await apiClient.post("/file/upload", formData, { signal });
	} catch (error) {
		if (retryCount > 0) {
			return uploadChunk({
				chunk,
				chunkIndex,
				filename,
				retryCount: retryCount - 1,
				signal,
			});
		}
		handleError(error);
		throw error;
	}
};

// Concurrent upload of chunks
const uploadChunks = async ({
	chunks,
	filename,
	concurrency = DEFAULT_CHUNK_CONCURRENCY,
	onProgress,
	signal,
}: UploadChunksOptions): Promise<void> => {
	let nextChunkIndex = 0;
	let completed = 0;

	const worker = async () => {
		while (true) {
			const chunkIndex = nextChunkIndex++;

			if (chunkIndex >= chunks.length) break;

			const chunk = chunks[chunkIndex];
			if (!chunk) break;

			await uploadChunk({
				chunk,
				chunkIndex,
				filename,
				signal,
			});

			completed += 1;

			onProgress?.(completed / chunks.length);
		}
	};

	const workers = Array.from(
		{ length: Math.min(concurrency, chunks.length || 1) },
		() => worker(),
	);

	await Promise.all(workers);
};

const mergeFile = async ({
	filename,
	totalChunks,
}: MergeFileOptions): Promise<UploadResult> => {
	const result = await zodPost(
		"/file/merge",
		{
			filename,
			total: totalChunks,
		},
		MergeFileResponseSchema,
	);

	return {
		fileId: result.file_id,
		filename,
	};
};

const waitForFileReady = async ({
	fileId,
	pollInterval = DEFAULT_STATUS_POLL_INTERVAL,
	timeout = DEFAULT_STATUS_TIMEOUT,
	signal,
}: {
	fileId: string;
	pollInterval?: number;
	timeout?: number;
	signal?: AbortSignal;
}): Promise<void> => {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		if (signal?.aborted) {
			throw new DOMException("The upload was aborted", "AbortError");
		}

		const file = await zodGet(`/file/${fileId}`, FileRecordSchema, {
			signal,
		});

		if (file.status === "ready") {
			return;
		}

		if (file.status === "error") {
			throw new Error(file.errorMessage || "File processing failed");
		}

		await sleep(pollInterval);
	}

	throw new Error("Timed out while waiting for the file to finish processing");
};

// Upload a single file
const uploadFile = async ({
	file,
	chunkSize,
	chunkConcurrency,
	statusPollInterval,
	statusTimeout,
	onProgress,
	signal,
}: UploadFileOptions): Promise<UploadResult> => {
	const chunks = createChunks({
		file,
		chunkSize,
	});

	await uploadChunks({
		chunks,
		filename: file.name,
		concurrency: chunkConcurrency,
		onProgress,
		signal,
	});

	const result = await mergeFile({
		filename: file.name,
		totalChunks: chunks.length,
	});

	await waitForFileReady({
		fileId: result.fileId,
		pollInterval: statusPollInterval,
		timeout: statusTimeout,
		signal,
	});

	onProgress?.(1);

	return result;
};

// Multi-file upload
const uploadFiles = async ({
	files,
	fileConcurrency = DEFAULT_FILE_CONCURRENCY,
	chunkConcurrency,
	onProgress,
	signal,
}: UploadFilesOptions): Promise<UploadResult[]> => {
	let nextFileIndex = 0;
	const results: UploadResult[] = [];

	const worker = async () => {
		while (true) {
			const fileIndex = nextFileIndex++;

			if (fileIndex >= files.length) break;

			const file = files[fileIndex];
			if (!file) break;

			results[fileIndex] = await uploadFile({
				file,
				chunkConcurrency,
				onProgress: (progress) => {
					onProgress?.(file, progress);
				},
				signal,
			});
		}
	};

	const workers = Array.from(
		{ length: Math.min(fileConcurrency, files.length || 1) },
		() => worker(),
	);

	await Promise.all(workers);

	return results.filter(Boolean);
};

const cancelUpload = async (filename: string): Promise<void> => {
	try {
		await voidPost("/file/cancel", { filename });
	} catch (error) {
		handleError(error);
		throw error;
	}
};

export { cancelUpload, uploadFiles, uploadFile, type UploadResult };

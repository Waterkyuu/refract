import { z } from "zod";

const UploadedChunksSchema = z.object({
	uploadedChunks: z.array(z.number()),
});

const MergeFileResponseSchema = z.object({
	file_id: z.string(),
});

const FileRecordSchema = z.object({
	id: z.string(),
	filename: z.string(),
	fileSize: z.number().nullable().optional(),
	status: z.string(),
	errorMessage: z.string().nullable().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

type UploadedChunks = z.infer<typeof UploadedChunksSchema>;
type FileRecord = z.infer<typeof FileRecordSchema>;
type MergeFileResponse = z.infer<typeof MergeFileResponseSchema>;

export {
	FileRecordSchema,
	MergeFileResponseSchema,
	UploadedChunksSchema,
	type FileRecord,
	type MergeFileResponse,
	type UploadedChunks,
};

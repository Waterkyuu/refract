import { z } from "zod";

const ApiResponseSchema = z.object({
	code: z.number(),
	success: z.boolean(),
	message: z.string(),
	data: z.unknown().optional(),
	error: z.string().optional(),
});

type ApiResponse<T = unknown> = {
	code: number;
	success: boolean;
	message: string;
	data?: T;
	error?: string;
};

export { ApiResponseSchema, type ApiResponse };

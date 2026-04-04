import { z } from "zod";

// Login validator schema
export const LoginInputSchema = z.object({
	email: z.email({ message: "Invaild emaild address" }),
});

// Code
export const CodeSchema = z.object({
	code: z.int().positive().max(6),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
export type Code = z.infer<typeof CodeSchema>;

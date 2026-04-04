import { z } from "zod";

export const UserSchema = z.object({
	id: z.uuid(),
	userName: z.string(),
	email: z.email(),
	avatar: z.string().nullable().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	banned: z.boolean().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

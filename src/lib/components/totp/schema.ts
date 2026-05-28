import z from 'zod';

export const enableSchema = z.object({
	password: z.string().min(8).max(128)
});

export const verifySchema = z.object({
	code: z.string().length(6)
});

export const disableSchema = z.object({
	password: z.string().min(8).max(128)
});

export type EnableSchema = typeof enableSchema;
export type VerifySchema = typeof verifySchema;
export type DisableSchema = typeof disableSchema;

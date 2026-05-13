import z from 'zod';

export const formSchema = z.strictObject({
	email: z.email(),
	password: z.string().min(8).max(128)
});

export type FormSchema = typeof formSchema;

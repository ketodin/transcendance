import z from 'zod';

export const formSchema = z.strictObject({
	email: z.email()
});

export type FormSchema = typeof formSchema;

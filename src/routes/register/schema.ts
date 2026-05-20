import z from 'zod';
import { m } from '$lib/paraglide/messages';

export const formSchema = z
	.strictObject({
		name: z.string().min(3).max(32).regex(/^\S+$/, { message: m.invalid_name() }),

		email: z.email(),

		password: z.string().min(8).max(128),

		repeatPassword: z.string().min(8).max(128)
	})
	.refine((data) => data.password === data.repeatPassword, {
		path: ['repeatPassword'],
		message: m.invalid_repeat()
	});

export type FormSchema = typeof formSchema;

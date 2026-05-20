import z from 'zod';

export const formSchema = z
	.strictObject({
		name: z.string().min(3).max(32).regex(/^\S+$/, { message: 'Spaces are not allowed' }),

		email: z.email(),

		password: z.string().min(8).max(128),

		repeatPassword: z.string().min(8).max(128)
	})
	.refine((data) => data.password === data.repeatPassword, {
		path: ['repeatPassword'],
		message: 'Passwords do not match'
	});

export type FormSchema = z.infer<typeof formSchema>;

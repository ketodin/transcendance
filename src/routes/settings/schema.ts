import { z } from 'zod';
import { m } from '$lib/paraglide/messages';

const MAX_FILE_SIZE = 500 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

export const avatarSchema = z.strictObject({
	file: z
		.instanceof(File, {
			message: m.please_upload_file()
		})
		.refine((f) => f.size > 0, 'File is required')
		.refine((f) => f.size <= MAX_FILE_SIZE, { error: m.max_upload_size })
		.refine((f) => ACCEPTED_TYPES.includes(f.type), { error: m.unknow_upload_file })
});

export const nameSchema = z.strictObject({
	name: z
		.string()
		.min(3)
		.max(32)
		.regex(/^[a-zA-Z0-9_-]+$/, { error: m.invalid_name })
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(8).max(128),
		newPassword: z.string().min(8).max(128),
		confirmPassword: z.string().min(8).max(128)
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		path: ['confirmPassword'],
		error: m.invalid_repeat
	});

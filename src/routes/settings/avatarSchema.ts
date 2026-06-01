import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [ 'image/png', 'image/jpeg' ];

export const avatarSchema = z.object({
	file: z
	.instanceof(File, {
		message: 'Please upload a file' // TODO: i18n
	})
	.refine((f) => f.size > 0, 'File is required')
	.refine(
		(f) => f.size <= MAX_FILE_SIZE,
		'Max 5MB upload size' // TODO: i18n
	)
	.refine(
		(f) => ACCEPTED_TYPES.includes(f.type),
		'Only PNG and JPEG images are allowed' // TODO: i18n
	)
});

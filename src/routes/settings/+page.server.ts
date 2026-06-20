import { Prisma } from '$lib/server/prisma/client';
import { redirect } from '@sveltejs/kit';
import { superValidate, setError, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { auth } from '$lib/server/auth';
import db from '$lib/server/db';
import { enableSchema, verifySchema, disableSchema } from '$lib/components/totp/schema';
import { avatarSchema, nameSchema, changePasswordSchema } from './schema';
import { m } from '$lib/paraglide/messages';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomInt } from 'crypto';
import type { Actions, PageServerLoad } from './$types';
import { fileTypeFromBuffer } from 'file-type';

export const load: PageServerLoad = async ({ locals }) => {
	const credentialAccount = await db.account.findFirst({
		where: { userId: locals.user!.id, providerId: 'credential' },
		select: { id: true }
	});
	return {
		user: locals.user!,
		hasPassword: credentialAccount !== null,
		nameForm: await superValidate({ name: locals.user!.name }, zod4(nameSchema), { id: 'name' }),

		avatarForm: await superValidate(zod4(avatarSchema), { id: 'avatar' }),

		changePasswordForm: await superValidate(zod4(changePasswordSchema), { id: 'password' }),

		enableForm: await superValidate(zod4(enableSchema), { id: 'totp-enable' }),

		verifyForm: await superValidate(zod4(verifySchema), { id: 'totp-verify' }),

		disableForm: await superValidate(zod4(disableSchema), { id: 'totp-disable' })
	};
};

export const actions: Actions = {
	avatar: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(avatarSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			const filePath = path.join(path.resolve('static/uploads'), locals.user!.id);
			const buffer = Buffer.from(await form.data.file.arrayBuffer());
			const type = await fileTypeFromBuffer(buffer);
			if (!type || !['image/jpeg', 'image/png'].includes(type.mime)) {
				return setError(form, 'file', m.error_generic());
			}
			await writeFile(filePath, buffer);
			await auth.api.updateUser({
				body: { image: `/avatar/${locals.user!.id}?k=${randomInt(0, 4096)}` },
				headers: request.headers
			});
		} catch {
			return setError(form, 'file', m.error_generic());
		}
		return message(form, 'Updated Avatar');
	},
	changeName: async ({ request }) => {
		const form = await superValidate(request, zod4(nameSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			await auth.api.updateUser({
				body: { name: form.data.name },
				headers: request.headers
			});
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code == 'P2002') {
				return setError(form, 'name', m.error_username_taken());
			}
			return setError(form, 'name', m.error_generic());
		}
		return message(form, 'Updated Name');
	},
	changePassword: async ({ request }) => {
		const form = await superValidate(request, zod4(changePasswordSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await auth.api.changePassword({
				body: {
					currentPassword: form.data.currentPassword,
					newPassword: form.data.newPassword,
					revokeOtherSessions: true
				},
				headers: request.headers
			});
		} catch (error: unknown) {
			const code = (error as { body?: { code?: string } })?.body?.code;
			if (code === 'INVALID_PASSWORD') {
				return setError(form, 'currentPassword', m.error_invalid_password());
			}
			return setError(form, 'currentPassword', m.error_generic());
		}

		return message(form, 'Password changed');
	},

	enable: async ({ request }) => {
		const form = await superValidate(request, zod4(enableSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const result = await auth.api.enableTwoFactor({
				body: { password: form.data.password },
				headers: request.headers
			});
			return message(form, { totpUri: result.totpURI, backupCodes: result.backupCodes });
		} catch (error: unknown) {
			const code = (error as { body?: { code?: string } })?.body?.code;
			if (code === 'INVALID_PASSWORD') {
				return setError(form, 'password', m.error_invalid_password());
			}
			return setError(form, 'password', m.error_generic());
		}
	},

	verify: async ({ request }) => {
		const form = await superValidate(request, zod4(verifySchema));
		if (!form.valid) return fail(400, { form });

		try {
			await auth.api.verifyTOTP({
				body: { code: form.data.code },
				headers: request.headers
			});
			return message(form, 'done' as const);
		} catch (error: unknown) {
			const code = (error as { body?: { code?: string } })?.body?.code;
			if (code === 'INVALID_TWO_FACTOR_COOKIE') {
				return setError(form, 'code', m.error_session_expired());
			}
			return setError(form, 'code', m.error_invalid_code());
		}
	},

	disable: async ({ request }) => {
		const form = await superValidate(request, zod4(disableSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await auth.api.disableTwoFactor({
				body: { password: form.data.password },
				headers: request.headers
			});
		} catch (error: unknown) {
			const code = (error as { body?: { code?: string } })?.body?.code;
			if (code === 'INVALID_PASSWORD') {
				return setError(form, 'password', m.error_invalid_password());
			}
			return setError(form, 'password', m.error_generic());
		}

		return redirect(303, '/settings');
	}
};

import { redirect } from '@sveltejs/kit';
import { superValidate, setError, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { auth } from '$lib/server/auth';
import db from '$lib/server/db';
import { enableSchema, verifySchema, disableSchema } from '$lib/components/totp/schema';
import { avatarSchema, nameSchema } from './schema';
import { m } from '$lib/paraglide/messages';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const credentialAccount = await db.account.findFirst({
		where: { userId: locals.user!.id, providerId: 'credential' },
		select: { id: true }
	});
	return {
		user: locals.user!,
		hasPassword: credentialAccount !== null,
		nameForm: await superValidate({ name: locals.user!.name }, zod4(nameSchema)),
		avatarForm: await superValidate(zod4(avatarSchema)),
		enableForm: await superValidate(zod4(enableSchema)),
		verifyForm: await superValidate(zod4(verifySchema)),
		disableForm: await superValidate(zod4(disableSchema))
	};
};

export const actions: Actions = {
	avatar: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(avatarSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const filePath = path.join(path.resolve('static/avatar'), locals.user!.id);
		const buffer = Buffer.from(await form.data.file.arrayBuffer());
		await writeFile(filePath, buffer);
		await auth.api.updateUser({
			body: { image: `/avatar/${locals.user!.id}` },
			headers: request.headers
		});
		return message(form, 'Updated Avatar');
	},
	changeName: async ({ request }) => {
		const form = await superValidate(request, zod4(nameSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		await auth.api.updateUser({
			body: { name: form.data.name },
			headers: request.headers
		});
		return message(form, 'Updated Name');
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

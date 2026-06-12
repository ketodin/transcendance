import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import db from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectTo = url.searchParams.get('redirectTo') ?? '/';

	if (!locals.user) redirect(303, '/login');

	if (!locals.user.name.startsWith('_tmp_')) {
		redirect(303, redirectTo);
	}

	return { redirectTo };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const redirectTo = (data.get('redirectTo') as string) ?? '/';

		if (!name || name.length < 3 || name.length > 32) {
			return fail(400, { error: 'username_length', redirectTo });
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
			return fail(400, { error: 'username_format', redirectTo });
		}

		const existing = await db.user.findUnique({ where: { name } });
		if (existing && existing.id !== locals.user.id) {
			return fail(400, { error: 'username_taken', redirectTo });
		}

		await auth.api.updateUser({
			body: { name },
			headers: request.headers
		});

		redirect(303, redirectTo);
	}
};

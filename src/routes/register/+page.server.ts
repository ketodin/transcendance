import { redirect } from '@sveltejs/kit';
import { superValidate, setError, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { auth } from '$lib/server/auth';
import db from '$lib/server/db';
import { formSchema } from './schema';
import { m } from '$lib/paraglide/messages';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return redirect(303, '/');
	}
	return { form: await superValidate(zod4(formSchema)) };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await superValidate(request, zod4(formSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const existingName = await db.user.findUnique({ where: { name: form.data.name } });
		if (existingName) {
			return setError(form, 'name', m.error_username_taken());
		}

		try {
			await auth.api.signUpEmail({
				body: form.data
			});
		} catch (error) {
			console.error(error);
			return setError(form, 'email', m.already_email());
		}

		const redirectTo = url.searchParams.get('redirectTo');
		const redirectUrl = redirectTo ? decodeURIComponent(redirectTo) : '';

		return redirect(303, '/' + redirectUrl);
	}
};

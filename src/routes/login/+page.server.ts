import { redirect } from '@sveltejs/kit';
import { superValidate, setError, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { auth } from '$lib/server/auth';
import { formSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { form: await superValidate(zod4(formSchema)) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(formSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await auth.api.signInEmail({
				body: form.data
			});
		} catch (error) {
			console.error(error);
			return setError(form, 'password', 'Invalid email or password');
		}

		return redirect(303, '/');
	}
};

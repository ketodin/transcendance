import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';
import { listFriends, sendOrAccept, dismissOrRemove } from '$lib/friends';
import { redirect } from '@sveltejs/kit';
import { superValidate, setError, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return redirect(303, '/login');

	const form = await superValidate(zod4(formSchema));
	const friends = await listFriends(locals.user.id);
	return { friends, form };
};

export const actions: Actions = {
	send: async ({ request, locals }) => {
		if (!locals.user) return redirect(303, '/login');

		const form = await superValidate(request, zod4(formSchema));
		if (!form.valid) return fail(400, { form });

		const other = await db.user.findUnique({
			where: { email: form.data.email }
		});
		if (!other) {
			return setError(form, 'email', 'No such user');
		}
		if (locals.user.id == other.id) {
			return setError(form, 'email', "Can't send a friend request to yourself");
		}

		await sendOrAccept(locals.user.id, other.id);
		return { form };
	},

	accept: async ({ request, locals }) => {
		if (!locals.user) return redirect(303, '/login');

		const data = await request.formData();
		const otherId = data.get('id');
		if (typeof otherId !== 'string')
			return fail(500, { error: 'id is missing or is not a string' });
		if (locals.user.id === otherId)
			return fail(500, { error: "can't accept a request to yourself" });

		await sendOrAccept(locals.user.id, otherId);
	},

	dismiss: async ({ request, locals }) => {
		if (!locals.user) return redirect(303, '/login');

		const data = await request.formData();
		const otherId = data.get('id');
		if (typeof otherId !== 'string')
			return fail(500, { error: 'id is missing or is not a string' });

		await dismissOrRemove(locals.user.id, otherId);
	}
};

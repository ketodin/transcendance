import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { m } from '$lib/paraglide/messages';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) return redirect(303, '/login');
	const user = await db.user.findUnique({
		where: { id: params.id }
	});
	if (!user) return error(404, m.no_user());
	return { userProfile: user };
};

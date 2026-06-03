import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { m } from '$lib/paraglide/messages';

export const load: PageServerLoad = async ({ params }) => {
	const user = await db.user.findUnique({
		where: { id: params.id }
	});
	if (!user) return error(404, m.no_user());
	return { userProfile: user };
};

import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const profile = await db.profile.findUnique({ where: { id: params.id } });
	if (!profile) {
		error(404, 'Profile not found');
	}
	return { profile };
};

export const actions: Actions = {
	levelup: async ({ params }) => {
		await db.profile.update({
			where: { id: params.id },
			data: { xp: { increment: 1 } }
		});
	},
	delete: async ({ params }) => {
		await db.profile.delete({
			where: { id: params.id }
		});
		redirect(303, '/profile');
	}
};

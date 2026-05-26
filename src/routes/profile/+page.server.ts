import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		return redirect(303, '/login');
	}

	// return error(404, "User not found");

	return { user: locals.user };
};

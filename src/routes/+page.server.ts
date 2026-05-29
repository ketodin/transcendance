import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		return redirect(303, '/login');
	}
	return { user: locals.user };
};

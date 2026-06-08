import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { matchMaker } from 'colyseus';

export const load: PageServerLoad = async ({ params }) => {
	if (params.id) {
		try {
			const reservation = await matchMaker.joinById(params.id, {});
			return { reservation };
		} catch (e) {
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('not found')) {
				error(410, 'Room no longer exists');
			} else throw e;
		}
	}

	const reservation = await matchMaker.joinOrCreate('tank_room', {});
	return { reservation };
};

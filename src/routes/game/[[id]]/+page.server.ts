import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { matchMaker } from 'colyseus';

export const load: PageServerLoad = async ({ params }) => {
	if (params.id) {
		const rooms = await matchMaker.query({ roomId: params.id });
		if (!rooms.length) error(410, 'Room no longer exists');
		return { reservation: null };
	}

	const reservation = await matchMaker.joinOrCreate('tank_room', {});
	return { reservation };
};

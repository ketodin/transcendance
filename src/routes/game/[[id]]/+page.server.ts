import type { PageServerLoad } from './$types';
import { matchMaker } from 'colyseus';

export const load: PageServerLoad = async ({ params }) => {
	const reservation = params.id
		? await matchMaker.joinById(params.id, {})
		: await matchMaker.joinOrCreate('tank_room', {});
	return { reservation };
};

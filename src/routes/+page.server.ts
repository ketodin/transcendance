import type { Actions } from './$types';
import { matchMaker } from 'colyseus';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export const actions: Actions = {
	newPrivateGame: async () => {
		const room = await matchMaker.createRoom('tank_room', { private: true });
		return redirect(303, resolve('/game/[[id]]', { id: room.roomId }));
	},
};

import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import { m } from '$lib/paraglide/messages';
import { matchMaker } from 'colyseus';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { statusHub } from '$lib/game/colyseus/statusHub';

export const load: PageServerLoad = async ({ params }) => {
	const user = await db.user.findUnique({
		where: { id: params.id }
	});
	if (!user) return error(404, m.no_user());
	return { userProfile: user };
};

export const actions: Actions = {
	invitePrivateGame: async ({ request, locals }) => {
		const formData = await request.formData();
		const userId = formData.get('userId');
		if (!userId || typeof userId !== 'string') return fail(400, 'userId must be a string');

		const room = await matchMaker.createRoom('tank_room', { private: true });
		statusHub.notify(userId, 'invite_request_received', {
			fromUserId: locals.user!.id,
			fromUserName: locals.user!.name,
			roomId: room.roomId
		});

		return redirect(303, resolve('/game/[[id]]', { id: room.roomId }));
	}
};

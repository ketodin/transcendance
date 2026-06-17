import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import { z } from 'zod';
import db from '$lib/server/db';
import { matchMaker } from 'colyseus';
import { statusHub } from '$lib/game/colyseus/statusHub';

export const send = command(z.string(), async (otherId) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return error(401, 'Unauthorized');

	const other = await db.user.findUnique({ where: { id: otherId } });
	if (!other) return error(404, 'User not found');
	if (locals.user.id === other.id) return error(400, 'Cannot invite yourself');

	const room = await matchMaker.createRoom('tank_room', { private: true });

	statusHub.notify(otherId, 'invite_request_received', {
		fromUserId: locals.user.id,
		fromUserName: locals.user.name,
		roomId: room.roomId
	});

	return { roomId: room.roomId };
});

export const accept = command(
	z.object({ roomId: z.string(), toUserId: z.string() }),
	async ({ roomId, toUserId }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) return error(401, 'Unauthorized');

		const rooms = await matchMaker.query({ roomId });
		if (rooms.length) {
			statusHub.notify(toUserId, 'invite_request_accepted', {
				fromUserName: locals.user.name
			});
		} else {
			return error(410, 'Room no longer exists');
		}

		return { roomId };
	}
);

export const deny = command(z.object({ toUserId: z.string() }), ({ toUserId }) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return error(401, 'Unauthorized');

	statusHub.notify(toUserId, 'invite_request_denied', {
		fromUserName: locals.user.name
	});
});

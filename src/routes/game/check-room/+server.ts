import { matchMaker } from 'colyseus';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const roomId = url.searchParams.get('id');
	if (!roomId) return json({ exists: false, reason: 'missing-id' });

	try {
		const rooms = await matchMaker.query({ roomId });
		const room = rooms.find((r) => !r.locked && r.clients < r.maxClients);
		return json({ exists: !!room });
	} catch {
		return json({ exists: false });
	}
};

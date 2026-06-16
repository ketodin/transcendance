import { matchMaker } from 'colyseus';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const roomId = url.searchParams.get('id');
	if (!roomId) return json({ exists: false, reason: 'missing-id' });

	try {
		const rooms = await matchMaker.query({ roomId });
		return json({ exists: rooms.length > 0 });
	} catch {
		return json({ exists: false });
	}
};

import { Prisma } from '$lib/server/prisma/client';
import { redirect, error, invalid } from '@sveltejs/kit';
import { query, command, form, getRequestEvent } from '$app/server';
import { z } from 'zod';
import db from '$lib/server/db';
import { getFriendList } from './friends';
import { statusHub } from '$lib/game/colyseus/statusHub';
import { m } from '$lib/paraglide/messages';

async function sendOrAccept(meId: string, otherId: string) {
	/// check for reverse request, accepted or not, and set it accepted if found
	const updates = await db.friendRequest.updateMany({
		where: { senderId: otherId, receiverId: meId },
		data: { status: 'ACCEPTED' }
	});
	/// if found any reverse request, stop
	if (updates.count > 0) {
		statusHub.friendAccepted(meId, otherId);
		return;
	}
	/// create a pending request if not already friend
	try {
		await db.friendRequest.create({
			data: { senderId: meId, receiverId: otherId, status: 'PENDING' }
		});
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			// ignore if already exist
		} else {
			throw e;
		}
	}
}

async function dismissOrRemove(meId: string, otherId: string) {
	await db.friendRequest.deleteMany({
		where: {
			OR: [
				{ senderId: meId, receiverId: otherId },
				{ senderId: otherId, receiverId: meId }
			]
		}
	});
	statusHub.friendRemoved(meId, otherId);
}

export const list = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) return redirect(303, '/login');
	return await getFriendList(locals.user.id);
});

export const accept = command(z.string(), async (otherId) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return error(401, 'Unautorized');
	if (locals.user.id === otherId) return; // skip if accepting to itself
	await sendOrAccept(locals.user.id, otherId);
	void list().refresh();
});

export const remove = command(z.string(), async (otherId) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return error(401, 'Unautorized');
	await dismissOrRemove(locals.user.id, otherId);
	void list().refresh();
});

export const send = form(z.strictObject({ email: z.email() }), async ({ email }, issue) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return redirect(303, '/login');
	const other = await db.user.findUnique({ where: { email } });
	if (!other) return invalid(issue.email('No such user'));
	if (locals.user.id == other.id) return invalid(issue.email(m.cannot_send_self()));
	await sendOrAccept(locals.user.id, other.id);
	void list().refresh();
});

import { Prisma, type User } from '$lib/server/prisma/client';
import { redirect, error, invalid } from '@sveltejs/kit';
import { query, command, form, getRequestEvent } from '$app/server';
import { z } from 'zod';
import db from '$lib/server/db';
import { getFriendList } from './friends';
import { statusHub } from '$lib/game/colyseus/statusHub';
import { m } from '$lib/paraglide/messages';

async function sendOrAccept(me: User, other: User) {
	/// check for reverse request, accepted or not, and set it accepted if found
	const updates = await db.friendRequest.updateMany({
		where: { senderId: other.id, receiverId: me.id },
		data: { status: 'ACCEPTED' }
	});
	/// if found any reverse request, stop
	if (updates.count > 0) {
		statusHub.friendAccepted(me.id, other.id);
		statusHub.notify(other.id, 'friend_request_accepted', { fromUserName: me.name });
		return;
	}
	/// create a pending request if not already friend
	try {
		await db.friendRequest.create({
			data: { senderId: me.id, receiverId: other.id, status: 'PENDING' }
		});
		statusHub.notify(other.id, 'friend_request_received', {});
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			// ignore if already exist
		} else {
			throw e;
		}
	}
}

async function dismissOrRemove(me: User, other: User) {
	const requests = await db.friendRequest.findMany({
		where: {
			OR: [
				{ senderId: me.id, receiverId: other.id },
				{ senderId: other.id, receiverId: me.id }
			]
		}
	});
	const isPending = requests.some((r) => r.status === 'PENDING');
	const isAccepted = requests.some((r) => r.status === 'ACCEPTED');
	await db.friendRequest.deleteMany({
		where: {
			OR: [
				{ senderId: me.id, receiverId: other.id },
				{ senderId: other.id, receiverId: me.id }
			]
		}
	});
	statusHub.friendRemoved(me.id, other.id);
	if (isPending) statusHub.notify(other.id, 'friend_request_denied', { fromUserName: me.name });
	else if (isAccepted) statusHub.notify(other.id, 'friend_request_removed', {});
}

export const list = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) return redirect(303, '/login');
	return await getFriendList(locals.user.id);
});

export const accept = command(z.string(), async (otherId) => {
	const { locals } = getRequestEvent();
	const other = await db.user.findUnique({ where: { id: otherId } });
	if (!locals.user || !other) return error(401, 'Unautorized');
	if (locals.user.id === other.id) return;
	await sendOrAccept(locals.user, other);
	void list().refresh();
});

export const remove = command(z.string(), async (otherId) => {
	const { locals } = getRequestEvent();
	const other = await db.user.findUnique({ where: { id: otherId } });
	if (!locals.user || !other) return error(401, 'Unautorized');
	if (locals.user.id === other.id) return;
	await dismissOrRemove(locals.user, other);
	void list().refresh();
});

export const send = form(z.strictObject({ email: z.email() }), async ({ email }, issue) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return redirect(303, '/login');
	const other = await db.user.findUnique({ where: { email } });
	if (!other) return invalid(issue.email('No such user'));
	if (locals.user.id == other.id) return invalid(issue.email(m.cannot_send_self()));
	await sendOrAccept(locals.user, other);
	void list().refresh();
});

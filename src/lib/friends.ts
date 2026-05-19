import { type User, Prisma } from '$lib/server/prisma/client';
import db from '$lib/server/db';

type Friends = {
	accepted: User[]; // mututal friends
	received: User[]; // pending request received
	sent: User[]; // pending request sent
};

export async function listFriends(meId: string): Promise<Friends> {
	const rawFriends = await db.friendRequest.findMany({
		where: { OR: [{ senderId: meId }, { receiverId: meId }] },
		include: { sender: true, receiver: true }
	});

	const accepted: User[] = [];
	const received: User[] = [];
	const sent: User[] = [];

	for (const raw of rawFriends) {
		if (raw.status == 'ACCEPTED') {
			if (raw.senderId == meId) accepted.push(raw.receiver);
			else accepted.push(raw.sender);
		} else if (raw.status == 'PENDING') {
			if (raw.senderId == meId) sent.push(raw.receiver);
			else received.push(raw.sender);
		}
	}

	return { accepted, received, sent };
}

/// WARN: race condition if exectued from both side at the same time, end up with 2 pending requests
export async function sendOrAccept(meId: string, otherId: string) {
	/// check for reverse request, accepted or not, and set it accepted if found
	const updates = await db.friendRequest.updateMany({
		where: { senderId: otherId, receiverId: meId },
		data: { status: 'ACCEPTED' }
	});
	/// if found any reverse request, stop
	if (updates.count > 0) {
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

/// TODO: check cascading delete, does deleting a user will remove it's friendships
export async function dismissOrRemove(meId: string, otherId: string) {
	/// delete request both way
	await db.friendRequest.deleteMany({
		where: {
			OR: [
				{ senderId: meId, receiverId: otherId },
				{ senderId: otherId, receiverId: meId }
			]
		}
	});
}

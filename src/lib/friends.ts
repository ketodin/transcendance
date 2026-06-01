import { type User } from '$lib/server/prisma/client';
import db from '$lib/server/db';

export type FriendRequestStatus = 'ACCEPTED' | 'RECEIVED' | 'SENT';
export type Friend = User & { friendRequestStatus: FriendRequestStatus };

export async function getFriendList(meId: string): Promise<Friend[]> {
	const rawFriends = await db.friendRequest.findMany({
		where: { OR: [{ senderId: meId }, { receiverId: meId }] },
		include: { sender: true, receiver: true }
	});

	const friends: Friend[] = [];
	for (const raw of rawFriends) {
		const status: FriendRequestStatus =
			raw.status == 'ACCEPTED' ? 'ACCEPTED' : raw.senderId == meId ? 'SENT' : 'RECEIVED';
		const user = raw.senderId == meId ? raw.receiver : raw.sender;
		friends.push({ ...user, friendRequestStatus: status });
	}
	return friends;
}

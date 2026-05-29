import { StatusRoom } from './StatusRoom';
import { FriendStatus } from '$lib/game/colyseus/schema/StatusRoomState';
import { getFriendList } from '$lib/friends'

const rooms = new Map<string, StatusRoom>();

export const statusHub = {
	bind(userId: string, room: StatusRoom) {
		rooms.set(userId, room);
	},

	unbind(userId: string) {
		rooms.delete(userId);
	},

	isOnline(userId: string) {
		return rooms.has(userId);
	},

	async setOnline(userId: string, online: boolean) {
		const friends = await getFriendList(userId);

		for (const friend of friends) {
			if (friend.friendRequestStatus !== 'ACCEPTED') continue;

			const room = rooms.get(friend.id);
			const presence = room?.state.friends.get(userId);
			if (presence) presence.online = online;
		}
	},

	friendAccepted(a: string, b: string) {
		const roomA = rooms.get(a);
		if (roomA && !roomA.state.friends.has(b)) {
			const p = new FriendStatus();
			p.id = b;
			p.online = rooms.has(b);
			roomA.state.friends.set(b, p);
		}

		const roomB = rooms.get(b);
		if (roomB && !roomB.state.friends.has(a)) {
			const p = new FriendStatus();
			p.id = a;
			p.online = rooms.has(a);
			roomB.state.friends.set(a, p);
		}
	},

	friendRemoved(a: string, b: string) {
		rooms.get(a)?.state.friends.delete(b);
		rooms.get(b)?.state.friends.delete(a);
	}
};

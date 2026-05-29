import { Room, type Client } from 'colyseus';
import { StatusState, FriendStatus } from './schema/StatusRoomState';
import { getFriendList } from '$lib/friends'
import { statusHub } from '$lib/game/colyseus/statusHub';

export class StatusRoom extends Room<{ state: StatusState }> {
	state = new StatusState();
	userId = '';
	maxClients = 1;

	async onJoin(client: Client, options: { userId: string }) {
		this.userId = options.userId;

		console.log("onJoin", this.userId);
		statusHub.bind(this.userId, this);

		const friends = await getFriendList(this.userId);// need to use this instead of non realtime sveltekit `query`

		for (const friend of friends) {
			if (friend.friendRequestStatus !== "ACCEPTED") continue;

			const p = new FriendStatus();
			p.id = friend.id;
			p.online = statusHub.isOnline(friend.id);
			this.state.friends.set(friend.id, p);
		}

		await statusHub.setOnline(this.userId, true);
	}

	async onDrop(client: Client, code: number) {
		console.log("onDrop", this.userId);
		await statusHub.setOnline(this.userId, false);
	}

	async onReconnect(client: Client) {
		console.log("onReconnect", this.userId);
		await statusHub.setOnline(this.userId, true);
	}
}
